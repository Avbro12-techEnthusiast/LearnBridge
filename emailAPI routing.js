// ============================================================
// FILE: backend/routes/emails.js
// Email queue management: preview, approve, bulk send, tracking
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendEmail } = require('../workers/emailWorker');

// GET all pending emails (for the approval dashboard)
router.get('/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('email_queue')
    .select(`
      *,
      students ( name, class_name, parent_name )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET all sent emails (for analytics)
router.get('/sent', async (req, res) => {
  const { data, error } = await supabase
    .from('email_queue')
    .select(`
      *,
      students ( name, class_name, parent_name )
    `)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET analytics summary
router.get('/analytics', async (req, res) => {
  const { data: sent } = await supabase
    .from('email_queue')
    .select('id, opened_at, sent_at')
    .eq('status', 'sent');

  const { data: pending } = await supabase
    .from('email_queue')
    .select('id')
    .eq('status', 'pending');

  const total = sent?.length || 0;
  const opened = sent?.filter(e => e.opened_at)?.length || 0;

  res.json({
    totalSent: total,
    totalOpened: opened,
    openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
    pendingApproval: pending?.length || 0,
  });
});

// POST approve a single email
router.post('/:id/approve', async (req, res) => {
  const { error } = await supabase
    .from('email_queue')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST bulk approve all pending emails
router.post('/bulk-approve', async (req, res) => {
  const { ids } = req.body; // array of email ids, or 'all'

  let query = supabase
    .from('email_queue')
    .update({ status: 'approved', approved_at: new Date().toISOString() });

  if (ids && ids !== 'all') {
    query = query.in('id', ids);
  } else {
    query = query.eq('status', 'pending');
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST bulk send all approved emails
router.post('/bulk-send', async (req, res) => {
  // Fetch all approved emails
  const { data: emails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'approved');

  if (error) return res.status(500).json({ error: error.message });
  if (!emails?.length) return res.json({ sent: 0, failed: 0 });

  let sent = 0;
  let failed = 0;
  const results = [];

  for (const email of emails) {
    try {
      await sendEmail({
        to: email.parent_email,
        subject: email.subject,
        html: email.body,
      });

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', email.id);

      sent++;
      results.push({ id: email.id, status: 'sent' });
    } catch (err) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed' })
        .eq('id', email.id);

      failed++;
      results.push({ id: email.id, status: 'failed', error: err.message });
    }
  }

  res.json({ sent, failed, results });
});

// GET open tracking pixel
router.get('/track/:token', async (req, res) => {
  const { token } = req.params;

  // Find the email by tracking_token
  const { data: email } = await supabase
    .from('email_queue')
    .select('id, opened_at')
    .eq('tracking_token', token)
    .single();

  if (email && !email.opened_at) {
    // Mark as opened
    await supabase
      .from('email_queue')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', email.id);

    // Log analytics event
    await supabase.from('email_analytics').insert([{
      email_id: email.id,
      event_type: 'opened',
      user_agent: req.headers['user-agent'] || null,
    }]);
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
  });
  res.end(pixel);
});

module.exports = router;