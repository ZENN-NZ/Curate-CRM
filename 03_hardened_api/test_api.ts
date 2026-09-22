import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@libsql/client';
import exceljs from 'exceljs';
import fs from 'fs';
import { LeadSchema } from '../src/types.js';
import { sanitizeForExcel } from '../01_security_threat_model/output/validation_specs.js';

const TEST_PORT = 3088;
const TEST_DB = 'file:api_test.db';
const TEST_DB_FILE = 'api_test.db';

function request(options: http.RequestOptions, postData?: any): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; json: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json: any = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.write(dataStr);
    }
    req.end();
  });
}

async function runApiTests() {
  console.log('========================================================');
  console.log('       STAGE 03: HARDENED EXPRESS API VERIFICATION      ');
  console.log('========================================================\n');

  if (fs.existsSync(TEST_DB_FILE)) {
    try { fs.unlinkSync(TEST_DB_FILE); } catch (_) {}
  }

  const db = createClient({ url: TEST_DB });
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

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Routes
  app.post('/api/leads', async (req, res) => {
    try {
      const validatedData = LeadSchema.parse(req.body);
      const result = await db.execute({
        sql: `INSERT INTO leads (
          first_name, last_name, dob, residential_address, postal_code, mobile_number, email_address, company_name, partner_name, partner_dob, partner_phone, partner_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          validatedData.firstName,
          validatedData.lastName,
          validatedData.dob,
          validatedData.residentialAddress,
          validatedData.postalCode,
          validatedData.mobileNumber,
          validatedData.emailAddress,
          validatedData.companyName || null,
          validatedData.partnerName || null,
          validatedData.partnerDob || null,
          validatedData.partnerPhone || null,
          validatedData.partnerEmail || null
        ]
      });
      res.status(201).json({ success: true, data: { id: result.lastInsertRowid?.toString() } });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, error: 'Validation failed', issues: error.issues });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  });

  app.put('/api/leads/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = LeadSchema.parse(req.body);
      await db.execute({
        sql: `UPDATE leads SET
          first_name = ?, last_name = ?, dob = ?, residential_address = ?, postal_code = ?, mobile_number = ?, email_address = ?, company_name = ?, partner_name = ?, partner_dob = ?, partner_phone = ?, partner_email = ?
        WHERE id = ?`,
        args: [
          validatedData.firstName,
          validatedData.lastName,
          validatedData.dob,
          validatedData.residentialAddress,
          validatedData.postalCode,
          validatedData.mobileNumber,
          validatedData.emailAddress,
          validatedData.companyName || null,
          validatedData.partnerName || null,
          validatedData.partnerDob || null,
          validatedData.partnerPhone || null,
          validatedData.partnerEmail || null,
          id
        ]
      });
      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, error: 'Validation failed', issues: error.issues });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  });

  app.get('/api/leads', async (req, res) => {
    try {
      const leadsResult = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
      const mappedLeads = leadsResult.rows.map(lead => ({
        id: lead.id,
        firstName: lead.first_name,
        lastName: lead.last_name,
        dob: lead.dob,
        residentialAddress: lead.residential_address,
        postalCode: lead.postal_code,
        mobileNumber: lead.mobile_number,
        emailAddress: lead.email_address,
        companyName: lead.company_name,
        partnerName: lead.partner_name,
        partnerDob: lead.partner_dob,
        partnerPhone: lead.partner_phone,
        partnerEmail: lead.partner_email,
        createdAt: lead.created_at
      }));
      res.json({ success: true, data: mappedLeads });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.get('/api/leads/export', async (req, res) => {
    try {
      const leadsResult = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Leads');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'First Name', key: 'first_name', width: 20 },
        { header: 'Last Name', key: 'last_name', width: 20 },
        { header: 'Company Name', key: 'company_name', width: 25 },
        { header: 'Email Address', key: 'email_address', width: 30 },
      ];

      leadsResult.rows.forEach(lead => {
        worksheet.addRow({
          id: lead.id,
          first_name: sanitizeForExcel(lead.first_name),
          last_name: sanitizeForExcel(lead.last_name),
          company_name: sanitizeForExcel(lead.company_name),
          email_address: sanitizeForExcel(lead.email_address)
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="curate_export.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  const server = app.listen(TEST_PORT);
  await new Promise(r => setTimeout(r, 200));

  try {
    // 1. Valid Creation
    console.log('[Test 1/5] Testing POST /api/leads with valid contact payload...');
    const postRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      firstName: 'Alice',
      lastName: 'Smith',
      dob: '1988-04-12',
      residentialAddress: '100 Queen Street, Auckland',
      postalCode: '1010',
      mobileNumber: '0211234567',
      emailAddress: 'alice.smith@example.co.nz',
      companyName: 'Acme Advisory'
    });

    console.log(`  Response Code: ${postRes.statusCode}`);
    if (postRes.statusCode !== 201 || !postRes.json?.data?.id) {
      throw new Error(`Expected 201 Created with id, got ${postRes.statusCode}: ${postRes.body}`);
    }
    const createdId = postRes.json.data.id;
    console.log(`  ✓ Successfully created lead ID: ${createdId}`);

    // 2. Invalid Payload Rejection (Zod Validation)
    console.log('\n[Test 2/5] Testing POST /api/leads with invalid payload (missing email, invalid DOB)...');
    const badRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      firstName: '',
      lastName: 'Incomplete',
      dob: 'not-a-date'
    });

    console.log(`  Response Code: ${badRes.statusCode}`);
    if (badRes.statusCode !== 400 || badRes.json?.success !== false) {
      throw new Error(`Expected 400 Bad Request, got ${badRes.statusCode}`);
    }
    console.log(`  ✓ Zod validation caught ${badRes.json.issues?.length || 0} issues correctly.`);

    // 3. Update Contact
    console.log(`\n[Test 3/5] Testing PUT /api/leads/${createdId} update...`);
    const putRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/leads/${createdId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      firstName: 'Alice',
      lastName: 'Smith-Jones',
      dob: '1988-04-12',
      residentialAddress: '200 Ponsonby Road, Auckland',
      postalCode: '1011',
      mobileNumber: '0211234567',
      emailAddress: 'alice.smith.jones@example.co.nz',
      companyName: 'Acme Advisory Ltd'
    });

    console.log(`  Response Code: ${putRes.statusCode}`);
    if (putRes.statusCode !== 200 || !putRes.json?.success) {
      throw new Error(`Expected 200 OK on update, got ${putRes.statusCode}`);
    }
    console.log('  ✓ Contact updated successfully.');

    // 4. Retrieve Contacts
    console.log('\n[Test 4/5] Testing GET /api/leads directory listing...');
    const getRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/leads',
      method: 'GET'
    });

    console.log(`  Response Code: ${getRes.statusCode}`);
    if (getRes.statusCode !== 200 || !Array.isArray(getRes.json?.data)) {
      throw new Error(`Expected 200 with lead array, got ${getRes.statusCode}`);
    }
    console.log(`  ✓ Retrieved ${getRes.json.data.length} lead(s) successfully.`);

    // 5. Excel Export Streaming
    console.log('\n[Test 5/5] Testing GET /api/leads/export spreadsheet download...');
    const exportRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/leads/export',
      method: 'GET'
    });

    console.log(`  Response Code: ${exportRes.statusCode}, Content-Type: ${exportRes.headers['content-type']}`);
    if (exportRes.statusCode !== 200 || !String(exportRes.headers['content-type']).includes('spreadsheetml')) {
      throw new Error(`Expected 200 with spreadsheetml content type, got ${exportRes.statusCode}`);
    }
    console.log('  ✓ Spreadsheet stream verified successfully.');

    console.log('\n========================================================');
    console.log('    ALL STAGE 03 API TESTS PASSED SUCCESSFULLY!         ');
    console.log('========================================================');
  } finally {
    server.close();
    try { db.close(); } catch (_) {}
    if (fs.existsSync(TEST_DB_FILE)) {
      try { fs.unlinkSync(TEST_DB_FILE); } catch (_) {}
    }
  }
}

runApiTests().catch(err => {
  console.error('\n❌ Stage 03 API Verification Failed:', err);
  process.exit(1);
});
