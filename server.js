// ============================================================
// FILE: backend/server.js
// Main Express server — entry point for LearnBridge backend
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const studentsRouter = require('./routes/students');
const badgesRouter  = require('./routes/badges');
const emailsRouter  = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or email client pixels)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LearnBridge Teacher Dashboard Backend',
    time: new Date().toISOString(),
  });
});

// Primary Routes
app.use('/api/students', studentsRouter);
app.use('/api/badges',   badgesRouter);

// Mount email queue, approval & analytics under /api/emails
app.use('/api/emails',   emailsRouter);

// Mount under /api as well for tracking pixel (/api/track/:token) and backward compatibility
app.use('/api',          emailsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`✅ LearnBridge Teacher Dashboard Backend running at http://localhost:${PORT}`);
  console.log(`   - Students API:  http://localhost:${PORT}/api/students`);
  console.log(`   - Badges API:    http://localhost:${PORT}/api/badges`);
  console.log(`   - Emails API:    http://localhost:${PORT}/api/emails`);
  console.log(`   - Health check:  http://localhost:${PORT}/health`);
});

module.exports = { app, server };