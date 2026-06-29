// ============================================================
// FILE: backend/routes/badges.js
// Award and manage behavior badges
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { generateEmailContent } = require('../workers/emailWorker');

// All available badge types (shared with frontend)
const BADGE_TYPES = [
  { type: 'helpful',    emoji: '⭐', label: 'Helpful' },
  { type: 'focused',   emoji: '📝', label: 'Focused' },
  { type: 'creative',  emoji: '🎨', label: 'Creative' },
  { type: 'kind',      emoji: '💛', label: 'Kind' },
  { type: 'leader',    emoji: '🏆', label: 'Leader' },
  { type: 'curious',   emoji: '🔍', label: 'Curious' },
  { type: 'teamwork',  emoji: '🤝', label: 'Teamwork' },
  { type: 'improved',  emoji: '📈', label: 'Improved' },
];

// GET available badge types
router.get('/types', (req, res) => {
  res.json(BADGE_TYPES);
});

// POST award a badge to a student
router.post('/', async (req, res) => {
  const { student_id, badge_type, notes, awarded_by } = req.body;

  if (!student_id || !badge_type || !awarded_by) {
    return res.status(400).json({ error: 'student_id, badge_type, and awarded_by are required' });
  }

  const badge = BADGE_TYPES.find(b => b.type === badge_type);
  if (!badge) return res.status(400).json({ error: 'Invalid badge_type' });

  // 1. Insert the badge
  const { data: newBadge, error: badgeErr } = await supabase
    .from('behavior_badges')
    .insert([{
      student_id,
      badge_type,
      badge_emoji: badge.emoji,
      badge_label: badge.label,
      notes,
      awarded_by,
    }])
    .select()
    .single();

  if (badgeErr) return res.status(500).json({ error: badgeErr.message });

  // 2. Fetch student info
  const { data: student, error: stuErr } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single();

  if (stuErr) return res.status(500).json({ error: stuErr.message });

  // 3. Generate email draft and queue it
  const { subject, body } = generateEmailContent({
    student,
    badges: [newBadge],
    teacherName: awarded_by,
    trackingToken: newBadge.id, // reuse badge id as temporary token
    appUrl: process.env.APP_URL || 'http://localhost:4000',
  });

  // FIXED: Explicitly added tracking_token field mapping to match routing queries
  await supabase.from('email_queue').insert([{
    student_id,
    parent_email: student.parent_email,
    subject,
    body,
    status: 'pending',
    tracking_token: newBadge.id
  }]);

  res.status(201).json(newBadge);
});

// DELETE a badge
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('behavior_badges')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;