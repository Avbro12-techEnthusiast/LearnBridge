// ============================================================
// FILE: backend/routes/students.js
// CRUD operations for students
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Seed sample students for development / testing
const mockStudents = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Arjun Sharma', class_name: 'Class 6A', parent_name: 'Ramesh Sharma', parent_email: 'ramesh.sharma@example.com', created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Priya Patel', class_name: 'Class 6A', parent_name: 'Sunita Patel', parent_email: 'sunita.patel@example.com', created_at: new Date().toISOString() },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Riya Mehta', class_name: 'Class 6B', parent_name: 'Deepa Mehta', parent_email: 'deepa.mehta@example.com', created_at: new Date().toISOString() },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Kabir Singh', class_name: 'Class 6B', parent_name: 'Gurpreet Singh', parent_email: 'gurpreet.singh@example.com', created_at: new Date().toISOString() },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Ananya Roy', class_name: 'Class 6A', parent_name: 'Subrata Roy', parent_email: 'subrata.roy@example.com', created_at: new Date().toISOString() },
];

const mockBadges = [
  { id: 'b1', student_id: '11111111-1111-4111-a111-111111111111', badge_type: 'helpful', badge_emoji: '⭐', badge_label: 'Helpful', notes: 'Helped solve math puzzles during group work', awarded_by: 'Teacher Alex', awarded_at: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'b2', student_id: '22222222-2222-4222-a222-222222222222', badge_type: 'creative', badge_emoji: '🎨', badge_label: 'Creative', notes: 'Created beautiful poster for science day', awarded_by: 'Teacher Alex', awarded_at: new Date(Date.now() - 3600000 * 48).toISOString() },
  { id: 'b3', student_id: '11111111-1111-4111-a111-111111111111', badge_type: 'focused', badge_emoji: '📝', badge_label: 'Focused', notes: 'Completed reading assignment early', awarded_by: 'Teacher Alex', awarded_at: new Date(Date.now() - 3600000 * 12).toISOString() },
];

const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  return url.startsWith('http') && !url.includes('placeholder') && !key.includes('your_actual');
};

// GET all students
router.get('/', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (!error && data) return res.json(data);
    } catch (err) {
      console.warn('Supabase students fetch failed:', err.message);
    }
  }

  // Return mock students
  res.json(mockStudents);
});

// GET single student with their badges
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data: student, error: sErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (!sErr && student) {
        const { data: badges } = await supabase
          .from('behavior_badges')
          .select('*')
          .eq('student_id', id)
          .order('awarded_at', { ascending: false });

        return res.json({ ...student, badges: badges || [] });
      }
    } catch (err) {
      console.warn('Supabase student fetch failed:', err.message);
    }
  }

  const student = mockStudents.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const badges = mockBadges.filter(b => b.student_id === id);
  res.json({ ...student, badges });
});

// POST create a student
router.post('/', async (req, res) => {
  const { name, class_name, parent_name, parent_email } = req.body;

  if (!name || !class_name || !parent_name || !parent_email) {
    return res.status(400).json({ error: 'All fields are required (name, class_name, parent_name, parent_email)' });
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{ name, class_name, parent_name, parent_email }])
        .select()
        .single();

      if (!error && data) return res.status(201).json(data);
    } catch (err) {
      console.warn('Supabase student insert failed:', err.message);
    }
  }

  const newStudent = {
    id: `stu-${Date.now()}`,
    name,
    class_name,
    parent_name,
    parent_email,
    created_at: new Date().toISOString(),
  };

  mockStudents.push(newStudent);
  res.status(201).json(newStudent);
});

// PUT update a student
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, class_name, parent_name, parent_email } = req.body;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({ name, class_name, parent_name, parent_email })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return res.json(data);
    } catch (err) {
      console.warn('Supabase student update failed:', err.message);
    }
  }

  const idx = mockStudents.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });

  mockStudents[idx] = {
    ...mockStudents[idx],
    name: name || mockStudents[idx].name,
    class_name: class_name || mockStudents[idx].class_name,
    parent_name: parent_name || mockStudents[idx].parent_name,
    parent_email: parent_email || mockStudents[idx].parent_email,
  };

  res.json(mockStudents[idx]);
});

// DELETE a student
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (!error) return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase student delete failed:', err.message);
    }
  }

  const idx = mockStudents.findIndex(s => s.id === id);
  if (idx !== -1) mockStudents.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;
module.exports.mockStudents = mockStudents;
module.exports.mockBadges = mockBadges;