import Dexie, { type EntityTable } from 'dexie';
import type { Lead, Workspace } from '../types';

export class CurateLocalDatabase extends Dexie {
  leads!: EntityTable<Lead, 'id'>;
  workspaces!: EntityTable<Workspace, 'id'>;

  constructor() {
    super('CurateLocalDB');
    this.version(1).stores({
      leads: 'id, workspaceId, [workspaceId+isDeleted], updatedAt, syncStatus, emailAddress, mobileNumber, lastName',
      workspaces: 'id, passkey, createdAt'
    });
  }
}

export const localDb = new CurateLocalDatabase();
