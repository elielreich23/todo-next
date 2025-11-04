import { Router } from 'express';
import { readDb, writeDb, nextId, DbProject } from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await readDb();
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const projects = db.projects.filter(p => p.ownerId === userId || (p.contributors || []).includes(userId));
  res.json(projects);
});

router.post('/', async (req, res) => {
  const db = await readDb();
  const body = req.body as Partial<DbProject>;
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const project: DbProject = {
    id: nextId(db.projects),
    ownerId: userId,
    name: body.name || 'Untitled project',
    category: body.category || 'General',
    contributors: (body.contributors as number[] | undefined) || [],
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
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const project = db.projects[idx];
  const canEdit = project.ownerId === userId || (project.contributors || []).includes(userId);
  if (!canEdit) return res.status(403).send('Forbidden');
  db.projects[idx] = { ...project, ...updates };
  await writeDb(db);
  res.json(db.projects[idx]);
});

router.delete('/', async (req, res) => {
  const id = Number(req.query.id);
  const db = await readDb();
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const before = db.projects.length;
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).send('Not found');
  if (project.ownerId !== userId) return res.status(403).send('Forbidden');
  db.projects = db.projects.filter(p => p.id !== id);
  db.tasks = db.tasks.filter(t => t.projectId !== id);
  if (db.projects.length === before) return res.status(404).send('Not found');
  await writeDb(db);
  res.status(204).send();
});

export default router;


