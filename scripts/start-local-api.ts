
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import handler from '../api/generate';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());
// Increase limit to support large image payloads (OCR)
app.use(bodyParser.json({ limit: '10mb' }));

// Log requests
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Route to the Vercel handler
app.post('/api/generate', async (req, res) => {
  try {
    // Vercel handlers are typically (req, res) => void | Promise<void>
    // Express req/res are compatible supersets for this purpose
    await handler(req, res);
  } catch (err) {
    console.error('[API] Handler Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// 404 for other API routes (Simple catch-all for /api subpaths)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Local API Server running at http://localhost:${PORT}
  🔑 Loaded GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Yes (Hidden)' : 'NO (Check .env)'}
  `);
});
