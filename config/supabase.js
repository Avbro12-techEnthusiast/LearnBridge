// ============================================================
// FILE: backend/config/supabase.js
// Supabase client initialization with resilient fallback
// ============================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const rawUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const rawKey = process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.trim() : '';

const isValidUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');

if (!isValidUrl) {
  console.warn('⚠️ [LearnBridge] Notice: SUPABASE_URL in .env is not set to a valid URL. Using development fallback URL.');
}

const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseKey = (rawKey && !rawKey.includes('your_actual')) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;