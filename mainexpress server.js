// ============================================================
// FILE: backend/server.js
// Main Express server — entry point for the backend
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
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/badges',   badgesRouter);

// FIXED: Mounted router onto base path to accurately expose /api/emails AND /api/track endpoints without nesting errors
app.use('/api', emailsRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Teacher Dashboard Backend running at http://localhost:${PORT}`);
});