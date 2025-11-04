import { Router } from 'express';
import { readDb, writeDb, nextId, DbTask } from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await readDb();
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const projectId = req.query.projectId as string | undefined;
  // tasks owned by user
  let tasks = db.tasks.filter(t => t.ownerId === userId);
  if (projectId) {
    const pid = Number(projectId);
    tasks = tasks.filter(t => t.projectId === pid);
  }
  // include tasks from projects where user collaborates
  const collabProjectIds = db.projects
    .filter(p => (p.contributors || []).includes(userId))
    .map(p => p.id);
  const collabTasks = db.tasks.filter(t => collabProjectIds.includes(t.projectId));
  const merged = [...tasks, ...collabTasks.filter(t => !tasks.find(x => x.id === t.id))];
  res.json(merged);
});

router.post('/', async (req, res) => {
  const db = await readDb();
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const body = req.body as Partial<DbTask> & { projectId: number };
  const task: DbTask = {
    id: nextId(db.tasks),
    projectId: Number(body.projectId),
    ownerId: userId,
    title: body.title || 'Untitled task',
    dueDate: body.dueDate,
    status: body.status || 'todo',
    description: body.description,
    project: body.project,
    progress: body.progress || 0,
    totalSteps: body.totalSteps || 0,
    attachments: body.attachments || [],
    comments: body.comments || [],
    category: body.category,
    contributors: body.contributors,
    duration: body.duration,
    notes: body.notes,
  };
  db.tasks.unshift(task);
  await writeDb(db);
  res.status(201).json(task);
});

router.put('/', async (req, res) => {
  const db = await readDb();
  const { id, ...updates } = req.body as Partial<DbTask> & { id: number };
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).send('Not found');
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const task = db.tasks[idx];
  const project = db.projects.find(p => p.id === task.projectId);
  const canEdit = task.ownerId === userId || project?.ownerId === userId || (project?.contributors || []).includes(userId);
  if (!canEdit) return res.status(403).send('Forbidden');
  db.tasks[idx] = { ...task, ...updates };
  await writeDb(db);
  res.json(db.tasks[idx]);
});

router.delete('/', async (req, res) => {
  const id = Number(req.query.id);
  const db = await readDb();
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).send('Missing user session');
  const before = db.tasks.length;
  const task = db.tasks.find(t => t.id === id);
  if (!task) return res.status(404).send('Not found');
  const project = db.projects.find(p => p.id === task.projectId);
  const canDelete = task.ownerId === userId || project?.ownerId === userId;
  if (!canDelete) return res.status(403).send('Forbidden');
  db.tasks = db.tasks.filter(t => t.id !== id);
  if (db.tasks.length === before) return res.status(404).send('Not found');
  await writeDb(db);
  res.status(204).send();
});

router.get('/:id/comments', async (req, res) => {
  const db = await readDb();
  const taskId = Number(req.params.id);
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).send('Task not found');
  res.json(task.comments || []);
});

router.post('/:id/comments', async (req, res) => {
  const db = await readDb();
  const taskId = Number(req.params.id);
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).send('Task not found');
  const { text, author } = req.body as { text: string; author?: string };
  const comment = {
    id: Date.now().toString(),
    text,
    author: author || 'Anonymous',
    createdAt: new Date().toISOString(),
  };
  task.comments = [...(task.comments || []), comment];
  await writeDb(db);
  res.status(201).json(comment);
});

router.put('/:id/comments', async (req, res) => {
  const db = await readDb();
  const taskId = Number(req.params.id);
  const { commentId, text } = req.body as { commentId: string; text: string };
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).send('Task not found');
  if (!task.comments) task.comments = [];
  const idx = task.comments.findIndex(c => c.id === commentId);
  if (idx === -1) return res.status(404).send('Comment not found');
  task.comments[idx] = { ...task.comments[idx], text, updatedAt: new Date().toISOString() };
  await writeDb(db);
  res.json(task.comments[idx]);
});

router.delete('/:id/comments', async (req, res) => {
  const db = await readDb();
  const taskId = Number(req.params.id);
  const commentId = String(req.query.commentId || '');
  if (!commentId) return res.status(400).send('commentId required');
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).send('Task not found');
  task.comments = (task.comments || []).filter(c => c.id !== commentId);
  await writeDb(db);
  res.status(204).send();
});

export default router;


