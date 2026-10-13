// ============================================================
// FILE: backend/routes/emails.js
// Email queue management: preview, approve, bulk send, tracking
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendEmail } = require('../workers/emailWorker');

// In-memory fallback queue for local development / testing without Supabase
const mockEmailQueue = [
  {
    id: 'mock-email-1',
    student_id: 'mock-stu-1',
    parent_email: 'ramesh.sharma@example.com',
    subject: '🌟 Arjun Sharma earned 1 badge today!',
    body: `
      <div style="font-family:sans-serif;padding:20px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#6366f1;">Arjun Sharma earned badges! 🎉</h2>
        <p>Dear Ramesh Sharma,</p>
        <p>Arjun has been awarded the ⭐ <strong>Helpful</strong> badge by Teacher Alex for helping peers with mathematics exercises.</p>
      </div>
    `,
    status: 'pending',
    tracking_token: 'track-token-1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    students: { name: 'Arjun Sharma', class_name: 'Class 6A', parent_name: 'Ramesh Sharma' },
  },
  {
    id: 'mock-email-2',
    student_id: 'mock-stu-2',
    parent_email: 'sunita.patel@example.com',
    subject: '🌟 Priya Patel earned 1 badge today!',
    body: `
      <div style="font-family:sans-serif;padding:20px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#6366f1;">Priya Patel earned badges! 🎉</h2>
        <p>Dear Sunita Patel,</p>
        <p>Priya has been awarded the 🎨 <strong>Creative</strong> badge by Teacher Alex for outstanding science poster design.</p>
      </div>
    `,
    status: 'sent',
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    opened_at: new Date(Date.now() - 43200000).toISOString(),
    tracking_token: 'track-token-2',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    students: { name: 'Priya Patel', class_name: 'Class 6A', parent_name: 'Sunita Patel' },
  },
];

// Helper to check if Supabase query succeeded
const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  return url.startsWith('http') && !url.includes('placeholder') && !key.includes('your_actual');
};

// GET all pending emails (for the approval dashboard)
router.get('/pending', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`*, students ( name, class_name, parent_name )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) return res.json(data);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to in-memory queue:', err.message);
    }
  }

  const pending = mockEmailQueue.filter(e => e.status === 'pending');
  res.json(pending);
});

// GET all sent emails (for analytics)
router.get('/sent', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`*, students ( name, class_name, parent_name )`)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false });

      if (!error && data) return res.json(data);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to in-memory queue:', err.message);
    }
  }

  const sent = mockEmailQueue.filter(e => e.status === 'sent');
  res.json(sent);
});

// GET analytics summary
router.get('/analytics', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data: sent, error: sErr } = await supabase
        .from('email_queue')
        .select('id, opened_at, sent_at')
        .eq('status', 'sent');

      const { data: pending, error: pErr } = await supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'pending');

      if (!sErr && !pErr && sent) {
        const total = sent.length;
        const opened = sent.filter(e => e.opened_at).length;
        return res.json({
          totalSent: total,
          totalOpened: opened,
          openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
          pendingApproval: pending ? pending.length : 0,
        });
      }
    } catch (err) {
      console.warn('Supabase analytics fetch failed, using fallback:', err.message);
    }
  }

  const sent = mockEmailQueue.filter(e => e.status === 'sent');
  const pending = mockEmailQueue.filter(e => e.status === 'pending');
  const total = sent.length;
  const opened = sent.filter(e => e.opened_at).length;

  res.json({
    totalSent: total,
    totalOpened: opened,
    openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
    pendingApproval: pending.length,
  });
});

// POST approve a single email
router.post('/:id/approve', async (req, res) => {
  const emailId = req.params.id;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', emailId);

      if (!error) return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase approve failed:', err.message);
    }
  }

  const item = mockEmailQueue.find(e => e.id === emailId);
  if (item) {
    item.status = 'approved';
    item.approved_at = new Date().toISOString();
  }
  res.json({ success: true });
});

// POST bulk approve all pending emails
router.post('/bulk-approve', async (req, res) => {
  const { ids } = req.body;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('email_queue')
        .update({ status: 'approved', approved_at: new Date().toISOString() });

      if (ids && ids !== 'all' && Array.isArray(ids)) {
        query = query.in('id', ids);
      } else {
        query = query.eq('status', 'pending');
      }

      const { error } = await query;
      if (!error) return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase bulk approve failed:', err.message);
    }
  }

  mockEmailQueue.forEach(e => {
    if (e.status === 'pending') {
      if (!ids || ids === 'all' || (Array.isArray(ids) && ids.includes(e.id))) {
        e.status = 'approved';
        e.approved_at = new Date().toISOString();
      }
    }
  });

  res.json({ success: true });
});

// POST bulk send all approved emails
router.post('/bulk-send', async (req, res) => {
  let emailsToSend = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'approved');

      if (!error && data) emailsToSend = data;
    } catch (err) {
      console.warn('Supabase bulk-send fetch failed:', err.message);
    }
  }

  if (!emailsToSend.length) {
    emailsToSend = mockEmailQueue.filter(e => e.status === 'approved');
  }

  if (!emailsToSend.length) {
    return res.json({ sent: 0, failed: 0, results: [] });
  }

  let sent = 0;
  let failed = 0;
  const results = [];

  for (const email of emailsToSend) {
    try {
      await sendEmail({
        to: email.parent_email,
        subject: email.subject,
        html: email.body,
      });

      if (isSupabaseConfigured()) {
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', email.id);
      }

      const mockItem = mockEmailQueue.find(e => e.id === email.id);
      if (mockItem) {
        mockItem.status = 'sent';
        mockItem.sent_at = new Date().toISOString();
      }

      sent++;
      results.push({ id: email.id, status: 'sent' });
    } catch (err) {
      if (isSupabaseConfigured()) {
        await supabase
          .from('email_queue')
          .update({ status: 'failed' })
          .eq('id', email.id);
      }

      const mockItem = mockEmailQueue.find(e => e.id === email.id);
      if (mockItem) mockItem.status = 'failed';

      failed++;
      results.push({ id: email.id, status: 'failed', error: err.message });
    }
  }

  res.json({ sent, failed, results });
});

// GET open tracking pixel
router.get('/track/:token', async (req, res) => {
  const { token } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data: email } = await supabase
        .from('email_queue')
        .select('id, opened_at')
        .eq('tracking_token', token)
        .single();

      if (email && !email.opened_at) {
        await supabase
          .from('email_queue')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', email.id);

        await supabase.from('email_analytics').insert([{
          email_id: email.id,
          event_type: 'opened',
          user_agent: req.headers['user-agent'] || null,
        }]);
      }
    } catch (err) {
      console.warn('Supabase tracking failed:', err.message);
    }
  }

  const mockItem = mockEmailQueue.find(e => e.tracking_token === token || e.id === token);
  if (mockItem && !mockItem.opened_at) {
    mockItem.opened_at = new Date().toISOString();
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

// Export router and mock queue for integration with badges
module.exports = router;
module.exports.mockEmailQueue = mockEmailQueue;
