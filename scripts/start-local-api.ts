import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateHandler from '../api/generate';
import checkoutHandler from '../api/checkout';
import feedbackHandler from '../api/feedback';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Zero-dependency in-memory rate limiter (100 req / 15 min per IP)
const rateWindows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQ = 100;

app.use('/api', (req, res, next) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local');
  const now = Date.now();
  const entry = rateWindows.get(ip);
  if (!entry || now > entry.resetAt) {
    rateWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_REQ) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  entry.count += 1;
  return next();
});

app.post('/api/generate', async (req, res) => {
  try {
    await generateHandler(req, res);
  } catch (error) {
    console.error('Local API Error (/api/generate):', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local API' });
    }
  }
});

app.all('/api/checkout', async (req, res) => {
  try {
    await checkoutHandler(req, res);
  } catch (error) {
    console.error('Local API Error (/api/checkout):', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local Checkout API' });
    }
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    await feedbackHandler(req, res);
  } catch (error) {
    console.error('Local API Error (/api/feedback):', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local Feedback API' });
    }
  }
});

const distPath = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/assets/')) {
      return next();
    }
    return res.sendFile(indexHtmlPath);
  });
}

function getLanIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

app.listen(PORT, HOST, () => {
  console.log(`Health-In-Check server listening on http://localhost:${PORT}`);
  const lanAddresses = getLanIPv4Addresses();
  for (const addr of lanAddresses) {
    console.log(`LAN / Mobile URL: http://${addr}:${PORT}`);
  }
});
