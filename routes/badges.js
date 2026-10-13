// ============================================================
// FILE: backend/routes/badges.js
// Award and manage behavior badges
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { generateEmailContent } = require('../workers/emailWorker');
const { mockStudents, mockBadges } = require('./students');
const { mockEmailQueue } = require('./emails');

// All available badge types (shared with frontend)
const BADGE_TYPES = [
  { type: 'helpful',    emoji: '⭐', label: 'Helpful',    description: 'Ready to assist peers and teachers' },
  { type: 'focused',   emoji: '📝', label: 'Focused',    description: 'Outstanding concentration and diligence' },
  { type: 'creative',  emoji: '🎨', label: 'Creative',   description: 'Original ideas and artistic expression' },
  { type: 'kind',      emoji: '💛', label: 'Kind',       description: 'Empathy, sharing, and positive energy' },
  { type: 'leader',    emoji: '🏆', label: 'Leader',     description: 'Inspiring peers and taking initiative' },
  { type: 'curious',   emoji: '🔍', label: 'Curious',    description: 'Asking inquisitive questions and exploring' },
  { type: 'teamwork',  emoji: '🤝', label: 'Teamwork',   description: 'Collaborating actively in group settings' },
  { type: 'improved',  emoji: '📈', label: 'Improved',   description: 'Remarkable effort and personal progress' },
];

const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  return url.startsWith('http') && !url.includes('placeholder') && !key.includes('your_actual');
};

// GET available badge types
router.get('/types', (req, res) => {
  res.json(BADGE_TYPES);
});

// POST award a badge to a student
router.post('/', async (req, res) => {
  const { student_id, badge_type, notes, awarded_by = 'Teacher Alex' } = req.body;

  if (!student_id || !badge_type) {
    return res.status(400).json({ error: 'student_id and badge_type are required' });
  }

  const badge = BADGE_TYPES.find(b => b.type === badge_type);
  if (!badge) return res.status(400).json({ error: 'Invalid badge_type' });

  if (isSupabaseConfigured()) {
    try {
      // 1. Insert badge
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

      if (!badgeErr && newBadge) {
        // 2. Fetch student info
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', student_id)
          .single();

        if (student) {
          // 3. Generate email draft and queue it
          const { subject, body } = generateEmailContent({
            student,
            badges: [newBadge],
            teacherName: awarded_by,
            trackingToken: newBadge.id,
            appUrl: process.env.APP_URL || 'http://localhost:4000',
          });

          await supabase.from('email_queue').insert([{
            student_id,
            parent_email: student.parent_email,
            subject,
            body,
            status: 'pending',
            tracking_token: newBadge.id,
          }]);
        }

        return res.status(201).json(newBadge);
      }
    } catch (err) {
      console.warn('Supabase award badge failed, using fallback:', err.message);
    }
  }

  // Fallback in-memory behavior
  const student = mockStudents.find(s => s.id === student_id);
  const newBadge = {
    id: `badge-${Date.now()}`,
    student_id,
    badge_type,
    badge_emoji: badge.emoji,
    badge_label: badge.label,
    notes: notes || '',
    awarded_by,
    awarded_at: new Date().toISOString(),
  };

  mockBadges.push(newBadge);

  if (student) {
    const { subject, body } = generateEmailContent({
      student,
      badges: [newBadge],
      teacherName: awarded_by,
      trackingToken: newBadge.id,
      appUrl: process.env.APP_URL || 'http://localhost:4000',
    });

    mockEmailQueue.unshift({
      id: `email-${Date.now()}`,
      student_id,
      parent_email: student.parent_email,
      subject,
      body,
      status: 'pending',
      tracking_token: newBadge.id,
      created_at: new Date().toISOString(),
      students: { name: student.name, class_name: student.class_name, parent_name: student.parent_name },
    });
  }

  res.status(201).json(newBadge);
});

// DELETE a badge
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('behavior_badges')
        .delete()
        .eq('id', id);

      if (!error) return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase badge delete failed:', err.message);
    }
  }

  const idx = mockBadges.findIndex(b => b.id === id);
  if (idx !== -1) mockBadges.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;