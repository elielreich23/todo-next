import { Router } from 'express';
import { readDb, writeDb, nextId, DbProject } from '../lib/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await readDb();
  res.json(db.projects);
});

router.post('/', async (req, res) => {
  const db = await readDb();
  const body = req.body as Partial<DbProject>;
  const project: DbProject = {
    id: nextId(db.projects),
    name: body.name || 'Untitled project',
    category: body.category || 'General',
    contributors: body.contributors || [],
    duration: body.duration,
    description: body.description,
  };
  db.projects.unshift(project);
  await writeDb(db);
  res.status(201).json(project);
});

router.put('/', async (req, res) => {
  const db = await readDb();
  const { id, ...updates } = req.body as Partial<DbProject> & { id: number };
  const idx = db.projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).send('Not found');
  db.projects[idx] = { ...db.projects[idx], ...updates };
  await writeDb(db);
  res.json(db.projects[idx]);
});

router.delete('/', async (req, res) => {
  const id = Number(req.query.id);
  const db = await readDb();
  const before = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== id);
  db.tasks = db.tasks.filter(t => t.projectId !== id);
  if (db.projects.length === before) return res.status(404).send('Not found');
  await writeDb(db);
  res.status(204).send();
});

export default router;


