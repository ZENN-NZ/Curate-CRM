import { createClient } from '@libsql/client';
import exceljs from 'exceljs';
import fs from 'fs';
import path from 'path';
import { sanitizeForExcel } from '../01_security_threat_model/output/validation_specs.js';

const TEST_DB = 'file:engine_test.db';
const TEST_DB_FILE = 'engine_test.db';
const TEST_XLSX_FILE = 'engine_test_output.xlsx';

async function runEngineTests() {
  console.log('========================================================');
  console.log('   STAGE 02: SECURE SQLITE ENGINE & EXCEL VERIFICATION  ');
  console.log('========================================================\n');

  // Clean previous artifacts if any
  if (fs.existsSync(TEST_DB_FILE)) {
    try { fs.unlinkSync(TEST_DB_FILE); } catch (_) {}
  }
  if (fs.existsSync(TEST_XLSX_FILE)) {
    try { fs.unlinkSync(TEST_XLSX_FILE); } catch (_) {}
  }

  const db = createClient({ url: TEST_DB });

  try {
    // 1. Database Schema Initialization
    console.log('[Test 1/4] Initializing SQLite database schema...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        residential_address TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        mobile_number TEXT NOT NULL,
        email_address TEXT DEFAULT '',
        company_name TEXT,
        partner_name TEXT,
        partner_contact TEXT,
        partner_dob TEXT,
        partner_phone TEXT,
        partner_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Table `leads` created successfully with parameterized schema.');

    // 2. SQL Injection Resistance Test (Parameterized Queries)
    console.log('\n[Test 2/4] Testing Parameterized SQL Injection resilience...');
    const sqliPayloads = [
      { first: "Robert'); DROP TABLE leads;--", last: "Smith" },
      { first: "' OR '1'='1", last: "Attacker" },
      { first: "Admin'--", last: "User" }
    ];

    for (const p of sqliPayloads) {
      await db.execute({
        sql: `INSERT INTO leads (
          first_name, last_name, dob, residential_address, postal_code, mobile_number, email_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [p.first, p.last, '1990-01-01', '123 Test St', '10001', '021123456', 'test@test.com']
      });
    }

    const countResult = await db.execute('SELECT COUNT(*) as count FROM leads');
    const leadCount = Number(countResult.rows[0].count);
    console.log(`  ✓ Inserted ${sqliPayloads.length} SQL injection probe records safely.`);
    console.log(`  ✓ Confirmed table exists and total row count is: ${leadCount}`);
    if (leadCount !== sqliPayloads.length) {
      throw new Error(`Expected ${sqliPayloads.length} records, found ${leadCount}`);
    }

    // 3. Formula Payloads Insertion & Excel Export Sanitization (CWE-1236)
    console.log('\n[Test 3/4] Inserting formula payloads & testing ExcelJS generation...');
    const formulaPayloads = [
      { first: '=1+1', last: '@SUM(1,5)', company: '-cmd|/C calc!A0' },
      { first: '+1234-5678', last: '\tTabAttack', company: '=HYPERLINK("http://malicious.org")' }
    ];

    for (const fp of formulaPayloads) {
      await db.execute({
        sql: `INSERT INTO leads (
          first_name, last_name, dob, residential_address, postal_code, mobile_number, email_address, company_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [fp.first, fp.last, '1995-05-15', '456 Safe Ave', '20002', '021987654', 'fuzz@test.org', fp.company]
      });
    }

    // Build Excel Workbook with formula sanitization
    const leadsResult = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
    const workbook = new exceljs.Workbook();
    workbook.creator = 'Curate';
    const worksheet = workbook.addWorksheet('Leads');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'First Name', key: 'first_name', width: 20 },
      { header: 'Last Name', key: 'last_name', width: 20 },
      { header: 'Company Name', key: 'company_name', width: 25 },
      { header: 'Residential Address', key: 'residential_address', width: 40 },
    ];

    leadsResult.rows.forEach((row) => {
      worksheet.addRow({
        id: row.id,
        first_name: sanitizeForExcel(row.first_name),
        last_name: sanitizeForExcel(row.last_name),
        company_name: sanitizeForExcel(row.company_name),
        residential_address: sanitizeForExcel(row.residential_address),
      });
    });

    await workbook.xlsx.writeFile(TEST_XLSX_FILE);
    console.log('  ✓ Excel file written to temporary output.');

    // 4. Inspect Generated Excel Cells
    console.log('\n[Test 4/4] Inspecting generated Excel cells for formula neutralization...');
    const verifyWorkbook = new exceljs.Workbook();
    await verifyWorkbook.xlsx.readFile(TEST_XLSX_FILE);
    const verifySheet = verifyWorkbook.getWorksheet('Leads');

    let neutralizedCount = 0;
    const triggers = ['=', '+', '-', '@', '\t', '\r', '%'];

    verifySheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const firstName = String(row.getCell(2).value || '');
      const lastName = String(row.getCell(3).value || '');
      const company = String(row.getCell(4).value || '');

      [firstName, lastName, company].forEach(val => {
        if (triggers.some(t => val.startsWith("'" + t))) {
          neutralizedCount++;
        }
      });
    });

    console.log(`  ✓ Neutralized cells verified with apostrophe prefix: ${neutralizedCount}`);
    if (neutralizedCount < 5) {
      throw new Error(`Expected at least 5 neutralized formula fields, got ${neutralizedCount}`);
    }

    console.log('\n========================================================');
    console.log('  ALL STAGE 02 ENGINE TESTS PASSED SUCCESSFULLY!       ');
    console.log('========================================================');
  } finally {
    // Cleanup
    try { db.close(); } catch (_) {}
    if (fs.existsSync(TEST_DB_FILE)) {
      try { fs.unlinkSync(TEST_DB_FILE); } catch (_) {}
    }
    if (fs.existsSync(TEST_XLSX_FILE)) {
      try { fs.unlinkSync(TEST_XLSX_FILE); } catch (_) {}
    }
  }
}

runEngineTests().catch(err => {
  console.error('\n❌ Stage 02 Engine Verification Failed:', err);
  process.exit(1);
});
