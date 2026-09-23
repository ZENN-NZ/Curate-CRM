import exceljs from 'exceljs';
import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { workspaceService } from './workspaceService';
import type { Lead } from '../types';

const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r', '%'];

export function sanitizeForExcel(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.length > 0 && FORMULA_TRIGGERS.some(t => str.startsWith(t))) {
    return "'" + str;
  }
  return str;
}

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

export type SyncResult = {
  status: 'synced' | 'pending' | 'offline' | 'error';
  pushedCount: number;
  pulledCount: number;
  message?: string;
};

export const leadService = {
  async getLeads(workspaceId?: string): Promise<Lead[]> {
    const wsId = workspaceId || workspaceService.getActiveWorkspaceId();
    const all = await localDb.leads
      .where('workspaceId')
      .equals(wsId)
      .toArray();

    return all
      .filter(l => !l.isDeleted)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async saveLead(data: Partial<Lead>): Promise<Lead> {
    const wsId = data.workspaceId || workspaceService.getActiveWorkspaceId();
    const id = data.id ? String(data.id) : generateUUID();
    const now = new Date().toISOString();

    const lead: Lead = {
      ...(data as Lead),
      id,
      workspaceId: wsId,
      createdAt: data.createdAt || now,
      updatedAt: now,
      isDeleted: false,
      syncStatus: 'pending',
    };

    await localDb.leads.put(lead);

    // Trigger asynchronous background sync if online
    this.syncWithSupabase().catch(err => {
      console.warn('Background sync deferred:', err);
    });

    return lead;
  },

  async deleteLead(id: string | number): Promise<void> {
    const record = await localDb.leads.get(String(id));
    if (record) {
      record.isDeleted = true;
      record.updatedAt = new Date().toISOString();
      record.syncStatus = 'pending';
      await localDb.leads.put(record);
      this.syncWithSupabase().catch(() => {});
    }
  },

  async exportToExcel(workspaceId?: string): Promise<void> {
    const leads = await this.getLeads(workspaceId);
    const workbook = new exceljs.Workbook();
    workbook.creator = 'Curate CRM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Leads');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
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
      fgColor: { argb: 'FF1E3A8A' },
    };

    leads.forEach(lead => {
      worksheet.addRow({
        id: lead.id,
        first_name: sanitizeForExcel(lead.firstName),
        last_name: sanitizeForExcel(lead.lastName),
        dob: sanitizeForExcel(lead.dob),
        mobile_number: sanitizeForExcel(lead.mobileNumber),
        email_address: sanitizeForExcel(lead.emailAddress),
        company_name: sanitizeForExcel(lead.companyName),
        residential_address: sanitizeForExcel(lead.residentialAddress),
        postal_code: sanitizeForExcel(lead.postalCode),
        partner_name: sanitizeForExcel(lead.partnerName),
        partner_dob: sanitizeForExcel(lead.partnerDob),
        partner_phone: sanitizeForExcel(lead.partnerPhone),
        partner_email: sanitizeForExcel(lead.partnerEmail),
        created_at: lead.createdAt,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curate_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async syncWithSupabase(): Promise<SyncResult> {
    if (!isSupabaseConfigured() || !supabase) {
      return { status: 'offline', pushedCount: 0, pulledCount: 0, message: 'Local mode (Supabase not configured)' };
    }

    const wsId = workspaceService.getActiveWorkspaceId();
    if (!wsId) {
      return { status: 'offline', pushedCount: 0, pulledCount: 0, message: 'No active workspace selected' };
    }

    try {
      const ws = await workspaceService.getActiveWorkspace();
      if (!ws) {
        return { status: 'offline', pushedCount: 0, pulledCount: 0, message: 'Active workspace not found' };
      }

      // 0. ENSURE WORKSPACE EXISTS IN SUPABASE (prevents foreign-key constraint violation on leads table)
      const { error: wsUpsertError } = await supabase.from('workspaces').upsert({
        id: ws.id,
        name: ws.name,
        passkey: ws.passkey,
        owner_email: ws.ownerEmail || null,
        owner_id: ws.ownerId || null,
        created_at: ws.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (wsUpsertError) {
        if (wsUpsertError.code === '42P01' || wsUpsertError.message?.includes('does not exist')) {
          return {
            status: 'error',
            pushedCount: 0,
            pulledCount: 0,
            message: 'Database tables missing in Supabase. Please run supabase/schema.sql in your Supabase SQL Editor.'
          };
        }
        throw wsUpsertError;
      }

      // 1. PUSH: Send local pending changes
      const pending = await localDb.leads
        .where('workspaceId')
        .equals(wsId)
        .filter(l => l.syncStatus === 'pending')
        .toArray();

      let pushedCount = 0;
      if (pending.length > 0) {
        const payload = pending.map(l => ({
          id: String(l.id),
          workspace_id: l.workspaceId,
          first_name: l.firstName,
          last_name: l.lastName,
          dob: l.dob,
          residential_address: l.residentialAddress,
          postal_code: l.postalCode,
          mobile_number: l.mobileNumber,
          email_address: l.emailAddress,
          company_name: l.companyName,
          partner_name: l.partnerName,
          partner_dob: l.partnerDob,
          partner_phone: l.partnerPhone,
          partner_email: l.partnerEmail,
          created_at: l.createdAt,
          updated_at: l.updatedAt,
          is_deleted: l.isDeleted || false,
        }));

        const { error } = await supabase.from('leads').upsert(payload, { onConflict: 'id' });
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return {
              status: 'error',
              pushedCount: 0,
              pulledCount: 0,
              message: 'Database tables missing in Supabase. Please run supabase/schema.sql in your Supabase SQL Editor.'
            };
          }
          throw error;
        }

        // Mark as synced locally
        for (const item of pending) {
          item.syncStatus = 'synced';
          await localDb.leads.put(item);
        }
        pushedCount = pending.length;
      }

      // 2. PULL: Fetch remote updates
      let query = supabase.from('leads').select('*').eq('workspace_id', wsId);

      if (ws.lastSyncedAt) {
        query = query.gt('updated_at', ws.lastSyncedAt);
      }

      const { data: remoteRows, error: pullError } = await query;
      if (pullError) {
        if (pullError.code === '42P01' || pullError.message?.includes('does not exist')) {
          return {
            status: 'error',
            pushedCount,
            pulledCount: 0,
            message: 'Database tables missing in Supabase. Please run supabase/schema.sql in your Supabase SQL Editor.'
          };
        }
        throw pullError;
      }

      let pulledCount = 0;
      if (remoteRows && remoteRows.length > 0) {
        for (const row of remoteRows) {
          const localItem = await localDb.leads.get(row.id);
          // Last-Write-Wins: apply remote if local doesn't exist or remote is newer
          const isRemoteNewer = !localItem || !localItem.updatedAt || new Date(row.updated_at) >= new Date(localItem.updatedAt);
          if (isRemoteNewer) {
            const mapped: Lead = {
              id: row.id,
              workspaceId: row.workspace_id,
              firstName: row.first_name,
              lastName: row.last_name,
              dob: row.dob,
              residentialAddress: row.residential_address,
              postalCode: row.postal_code,
              mobileNumber: row.mobile_number,
              emailAddress: row.email_address,
              companyName: row.company_name,
              partnerName: row.partner_name,
              partnerDob: row.partner_dob,
              partnerPhone: row.partner_phone,
              partnerEmail: row.partner_email,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              isDeleted: row.is_deleted,
              syncStatus: 'synced',
            };
            await localDb.leads.put(mapped);
            pulledCount++;
          }
        }
      }

      // Update workspace lastSyncedAt
      ws.lastSyncedAt = new Date().toISOString();
      await localDb.workspaces.put(ws);

      return { status: 'synced', pushedCount, pulledCount };
    } catch (err: any) {
      console.error('Supabase sync error:', err);
      const isMissingTable = err.code === '42P01' || err.message?.includes('does not exist');
      const msg = isMissingTable
        ? 'Database tables missing in Supabase. Please run supabase/schema.sql in your Supabase SQL Editor.'
        : err.message || 'Sync failed';
      return { status: 'error', pushedCount: 0, pulledCount: 0, message: msg };
    }
  }
};
