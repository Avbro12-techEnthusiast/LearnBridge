// ============================================================
// FILE: backend/routes/students.js
// CRUD operations for students
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET all students
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single student with their badges
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (sErr) return res.status(404).json({ error: 'Student not found' });

  const { data: badges } = await supabase
    .from('behavior_badges')
    .select('*')
    .eq('student_id', id)
    .order('awarded_at', { ascending: false });

  res.json({ ...student, badges: badges || [] });
});

// POST create a student
router.post('/', async (req, res) => {
  const { name, class_name, parent_name, parent_email } = req.body;

  if (!name || !class_name || !parent_name || !parent_email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const { data, error } = await supabase
    .from('students')
    .insert([{ name, class_name, parent_name, parent_email }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE a student
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;