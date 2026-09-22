import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createClient } from "@libsql/client";
import exceljs from "exceljs";
import { LeadSchema } from "./src/types.js";

const PORT = 3000;

async function initializeDatabase() {
  const db = createClient({
    url: "file:leads.db",
  });

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

  // Migration for existing tables
  const cols = ["company_name", "partner_dob", "partner_phone", "email_address", "partner_email"];
  for (const col of cols) {
    try {
      await db.execute(`ALTER TABLE leads ADD COLUMN ${col} TEXT`);
    } catch (e) {
      // Ignore if column already exists
    }
  }

  return db;
}

async function startServer() {
  const app = express();
  
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors());
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  const db = await initializeDatabase();

  app.post("/api/leads", async (req, res) => {
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
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "Validation failed", issues: error.issues });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
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
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "Validation failed", issues: error.issues });
      } else {
        console.error("Error updating lead:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  });

  app.get("/api/leads", async (req, res) => {
    try {
      const leadsResult = await db.execute("SELECT * FROM leads ORDER BY created_at DESC");
      const leads = leadsResult.rows;
      
      const mappedLeads = leads.map(lead => ({
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
      console.error("Error fetching leads:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.get("/api/leads/export", async (req, res) => {
    try {
      const leadsResult = await db.execute("SELECT * FROM leads ORDER BY created_at DESC");
      const leads = leadsResult.rows;
      
      const workbook = new exceljs.Workbook();
      workbook.creator = 'Nexus';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Leads');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'First Name', key: 'first_name', width: 20 },
        { header: 'Last Name', key: 'last_name', width: 20 },
        { header: 'Date of Birth', key: 'dob', width: 15 },
        { header: 'Mobile Number', key: 'mobile_number', width: 20 },
        { header: 'Email Address', key: 'email_address', width: 30 },
        { header: 'Company Name', key: 'company_name', width: 25 },
        { header: 'Residential Address', key: 'residential_address', width: 40 },
        { header: 'Postal Code', key: 'postal_code', width: 15 },
        { header: 'Partner Name', key: 'partner_name', width: 25 },
        { header: 'Partner DOB', key: 'partner_dob', width: 15 },
        { header: 'Partner Phone', key: 'partner_phone', width: 20 },
        { header: 'Partner Email', key: 'partner_email', width: 30 },
        { header: 'Date Added', key: 'created_at', width: 25 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Emerald 600
      };

      const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r', '%'];
      const sanitizeCell = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val).trim();
        if (str.length > 0 && FORMULA_TRIGGERS.some(t => str.startsWith(t))) {
          return "'" + str;
        }
        return str;
      };

      leads.forEach((lead) => {
        worksheet.addRow({
          id: lead.id,
          first_name: sanitizeCell(lead.first_name),
          last_name: sanitizeCell(lead.last_name),
          dob: sanitizeCell(lead.dob),
          mobile_number: sanitizeCell(lead.mobile_number),
          email_address: sanitizeCell(lead.email_address),
          company_name: sanitizeCell(lead.company_name),
          residential_address: sanitizeCell(lead.residential_address),
          postal_code: sanitizeCell(lead.postal_code),
          partner_name: sanitizeCell(lead.partner_name),
          partner_dob: sanitizeCell(lead.partner_dob),
          partner_phone: sanitizeCell(lead.partner_phone),
          partner_email: sanitizeCell(lead.partner_email),
          created_at: lead.created_at,
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="curate_export_' + new Date().toISOString().split('T')[0] + '.xlsx"'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
