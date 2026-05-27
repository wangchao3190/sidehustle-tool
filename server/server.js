require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./db/schema');
const { getPlaybookCount, upsertPlaybook } = require('./db/queries');
const { seedPlaybooks } = require('./services/playbookBuilder');
const sessionMiddleware = require('./middleware/session');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────

// CORS: allow frontend dev server
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  exposedHeaders: ['X-Session-Id'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(sessionMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── Routes ────────────────────────────────────────────────

const quizRouter = require('./routes/quiz');
const playbookRouter = require('./routes/playbook');
const paymentRouter = require('./routes/payment');
const feedbackRouter = require('./routes/feedback');

app.use('/api/quiz', quizRouter);
app.use('/api/playbook', playbookRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/feedback', feedbackRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    message: '接口不存在',
    code: 'NOT_FOUND',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    message: err.message || '服务器内部错误',
    code: 'INTERNAL_ERROR',
  });
});

// ─── Startup ───────────────────────────────────────────────

async function startServer() {
  try {
    // Initialize database
    console.log('[Server] Initializing database...');
    await initDatabase();

    // Seed playbooks from sidehustles.json if empty
    const playbookCount = getPlaybookCount();
    if (playbookCount === 0) {
      console.log('[Server] Seeding playbooks from data file...');
      const seededCount = seedPlaybooks(upsertPlaybook);
      console.log(`[Server] Seeded ${seededCount} playbooks`);
    } else {
      console.log(`[Server] Playbooks table already has ${playbookCount} entries, skipping seed`);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`[Server] Side Hustle Playbook API is running on http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);

      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-2f4c083c320f407eaea2fec95ba8c855') {
        console.warn('[Server] WARNING: ANTHROPIC_API_KEY is not configured. Quiz matching will fail.');
        console.warn('[Server] Set your key in server/.env');
      }
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
