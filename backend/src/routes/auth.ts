import { Router } from 'express';
import { readDb, writeDb, nextId } from '../lib/db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, email } = req.body as { username?: string; email?: string };
  const db = await readDb();
  const user = db.users.find(u => (username && u.username === username) || (email && u.email === email));
  if (!user) return res.status(401).send('Invalid credentials');
  res.json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName });
});

router.post('/signup', async (req, res) => {
  const { username, email, fullName } = req.body as { username: string; email: string; fullName?: string };
  const db = await readDb();
  const exists = db.users.find(u => u.email === email || u.username === username);
  if (exists) return res.status(409).send('User already exists');
  const user = { id: nextId(db.users), username, email, fullName: fullName || username };
  db.users.push(user);
  await writeDb(db);
  res.status(201).json(user);
});

export default router;


