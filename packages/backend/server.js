import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';

const app = express();
const port = 3000;

const validTokens = new Set();
const reports = [];

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);
app.use(express.json());

app.post('/request-token', (_req, res) => {
  const token = crypto.randomUUID();
  validTokens.add(token);

  return res.status(200).json({ token });
});

app.post('/submit-report', (req, res) => {
  const { token, contactName, riskScore, reasons } = req.body ?? {};

  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  validTokens.delete(token);

  const storedReport = {
    report: {
      contactName: contactName ?? null,
      riskScore: riskScore ?? null,
      reasons: Array.isArray(reasons) ? reasons : []
    },
    identity: null,
    ip: null,
    sessionId: null,
    timestamp: null
  };

  reports.push(storedReport);
  console.log(storedReport);

  return res.status(200).json({ success: true, log: storedReport });
});

app.get('/reports', (_req, res) => {
  return res.status(200).json(reports);
});

app.listen(port, () => {
  console.log(`Anonymized report server listening on port ${port}`);
});
