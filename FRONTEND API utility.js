// ============================================================
// FILE: frontend/lib/api.js
// Centralized API calls to the backend
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Students
export const getStudents = () => api.get('/api/students').then(r => r.data);
export const getStudent  = (id) => api.get(`/api/students/${id}`).then(r => r.data);
export const createStudent = (body) => api.post('/api/students', body).then(r => r.data);
export const deleteStudent = (id) => api.delete(`/api/students/${id}`).then(r => r.data);

// Badges
export const getBadgeTypes = () => api.get('/api/badges/types').then(r => r.data);
export const awardBadge = (body) => api.post('/api/badges', body).then(r => r.data);

// Emails
export const getPendingEmails  = () => api.get('/api/emails/pending').then(r => r.data);
export const getSentEmails     = () => api.get('/api/emails/sent').then(r => r.data);
export const getAnalytics      = () => api.get('/api/emails/analytics').then(r => r.data);
export const approveEmail      = (id) => api.post(`/api/emails/${id}/approve`).then(r => r.data);
export const bulkApprove       = (ids) => api.post('/api/emails/bulk-approve', { ids }).then(r => r.data);
export const bulkSend          = () => api.post('/api/emails/bulk-send').then(r => r.data);

export default api;