import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Very small auth shim: expect x-user-id header from the client for scoping
app.use((req, _res, next) => {
  const hdr = req.header('x-user-id');
  (req as any).userId = hdr ? Number(hdr) : undefined;
  next();
});

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


