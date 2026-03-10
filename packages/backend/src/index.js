import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});