import { promises as fs } from 'node:fs';
import path from 'node:path';

export type DbUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  password?: string;
};

export type DbProject = {
  id: number;
  name: string;
  category?: string;
  contributors?: string[];
  duration?: string;
  description?: string;
};

export type DbTaskComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
};

export type DbFileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type DbTask = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'done';
  description?: string;
  project?: string;
  progress?: number;
  totalSteps?: number;
  attachments?: DbFileAttachment[];
  comments?: DbTaskComment[];
  category?: string;
  contributors?: string[];
  duration?: string;
  notes?: string;
};

export type DbShape = {
  users: DbUser[];
  projects: DbProject[];
  tasks: DbTask[];
};

const dataFile = path.join(process.cwd(), 'data', 'db.json');

async function ensureFile(): Promise<void> {
  try {
    await fs.access(dataFile);
  } catch {
    const initial: DbShape = { users: [], projects: [], tasks: [] };
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(initial, null, 2), 'utf8');
  }
}

export async function readDb(): Promise<DbShape> {
  await ensureFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw) as DbShape;
}

export async function writeDb(db: DbShape): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2), 'utf8');
}

export function nextId(list: { id: number }[]): number {
  const max = list.reduce((m, item) => (item.id > m ? item.id : m), 0);
  return max + 1;
}


