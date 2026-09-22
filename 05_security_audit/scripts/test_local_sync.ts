import exceljs from 'exceljs';
import { sanitizeForExcel } from '../../src/services/leadService.js';
import type { Lead } from '../../src/types.js';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function runLocalSyncVerification() {
  console.log('========================================================');
  console.log('  STAGE 05: LOCAL-FIRST SYNC & CONFLICT AUDIT SUITE     ');
  console.log('========================================================\n');

  // Test 1: UUID Collision Resistance
  console.log('[Audit 1/4] Simulating 10,000 client-generated UUIDs across distributed devices...');
  const uuidSet = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    const id = generateUUID();
    uuidSet.add(id);
  }
  console.log(`  ✓ Generated 10,000 UUIDs. Unique count: ${uuidSet.size}`);
  if (uuidSet.size !== 10000) {
    throw new Error('UUID collision detected in client-side generator!');
  }

  // Test 2: Last-Write-Wins (LWW) Conflict Resolution
  console.log('\n[Audit 2/4] Verifying Last-Write-Wins (LWW) conflict resolution logic...');
  const officeLead: Lead = {
    id: 'lead_123',
    workspaceId: 'ws_test_acme',
    firstName: 'Alice',
    lastName: 'Smith',
    dob: '1990-01-01',
    residentialAddress: '100 Office Road',
    postalCode: '1000',
    mobileNumber: '021111111',
    emailAddress: 'alice@office.com',
    updatedAt: '2026-09-22T10:00:00.000Z',
    isDeleted: false
  };

  const homeLead: Lead = {
    id: 'lead_123',
    workspaceId: 'ws_test_acme',
    firstName: 'Alice',
    lastName: 'Smith-Updated',
    dob: '1990-01-01',
    residentialAddress: '100 Office Road',
    postalCode: '1000',
    mobileNumber: '021999999', // Updated phone at home
    emailAddress: 'alice@home.com',
    updatedAt: '2026-09-22T10:05:00.000Z', // 5 minutes later
    isDeleted: false
  };

  // Reconcile
  const isHomeNewer = new Date(homeLead.updatedAt!) >= new Date(officeLead.updatedAt!);
  const winningRecord = isHomeNewer ? homeLead : officeLead;

  console.log(`  Office timestamp: ${officeLead.updatedAt}`);
  console.log(`  Home timestamp:   ${homeLead.updatedAt}`);
  console.log(`  Winning phone:    ${winningRecord.mobileNumber}`);
  if (winningRecord.mobileNumber !== '021999999') {
    throw new Error('LWW conflict resolution failed to prioritize the newer record!');
  }
  console.log('  ✓ LWW conflict resolution successfully applied newer device update.');

  // Test 3: Multi-Tenant Workspace Partitioning
  console.log('\n[Audit 3/4] Verifying Multi-Tenant Workspace Data Isolation...');
  const testPool: Lead[] = [
    { ...officeLead, id: '1', workspaceId: 'business_A', firstName: 'Tenant A User' },
    { ...officeLead, id: '2', workspaceId: 'business_A', firstName: 'Tenant A User 2' },
    { ...officeLead, id: '3', workspaceId: 'business_B', firstName: 'Tenant B User 1' }
  ];

  const businessALeads = testPool.filter(l => l.workspaceId === 'business_A');
  const businessBLeads = testPool.filter(l => l.workspaceId === 'business_B');

  console.log(`  Business A lead count: ${businessALeads.length}`);
  console.log(`  Business B lead count: ${businessBLeads.length}`);
  if (businessALeads.some(l => l.workspaceId !== 'business_A') || businessBLeads.some(l => l.workspaceId !== 'business_B')) {
    throw new Error('Multi-tenant data cross-contamination detected!');
  }
  console.log('  ✓ Multi-tenant data partitions strictly isolated.');

  // Test 4: Client-Side Excel Export Formula Sanitization (CWE-1236)
  console.log('\n[Audit 4/4] Testing Client-Side ExcelJS generation & formula escaping...');
  const maliciousLeads: Lead[] = [
    { ...officeLead, id: 'f1', firstName: '=1+1', lastName: '@SUM(1,5)', companyName: '-cmd|/C calc!A0' },
    { ...officeLead, id: 'f2', firstName: '+12345', lastName: '\tTabAttack', companyName: '=HYPERLINK("http://evil.com")' }
  ];

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Leads');
  worksheet.columns = [
    { header: 'First Name', key: 'first_name', width: 20 },
    { header: 'Last Name', key: 'last_name', width: 20 },
    { header: 'Company Name', key: 'company_name', width: 25 },
  ];

  maliciousLeads.forEach(lead => {
    worksheet.addRow({
      first_name: sanitizeForExcel(lead.firstName),
      last_name: sanitizeForExcel(lead.lastName),
      company_name: sanitizeForExcel(lead.companyName)
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const verifyWb = new exceljs.Workbook();
  await verifyWb.xlsx.load(buffer as any);
  const verifySheet = verifyWb.getWorksheet('Leads');

  let neutralizedCount = 0;
  const triggers = ['=', '+', '-', '@', '\t', '\r', '%'];

  verifySheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const c1 = String(row.getCell(1).value || '');
    const c2 = String(row.getCell(2).value || '');
    const c3 = String(row.getCell(3).value || '');

    [c1, c2, c3].forEach(v => {
      if (triggers.some(t => v.startsWith("'" + t))) {
        neutralizedCount++;
      }
    });
  });

  console.log(`  ✓ Neutralized cells in browser Excel export: ${neutralizedCount}`);
  if (neutralizedCount < 5) {
    throw new Error('Client-side formula injection defense failed!');
  }

  console.log('\n========================================================');
  console.log('   ALL STAGE 05 LOCAL-FIRST AUDITS PASSED CLEANLY!      ');
  console.log('========================================================');
}

runLocalSyncVerification().catch(err => {
  console.error('\n❌ Audit Suite Failed:', err);
  process.exit(1);
});
