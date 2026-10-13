// ============================================================
// FILE: frontend/pages/index.js
// Teacher Dashboard Overview
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getStudents, getBadgeTypes, awardBadge, getAnalytics } from '../lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [analytics, setAnalytics] = useState({ totalSent: 0, totalOpened: 0, openRate: 0, pendingApproval: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, badgeRes, anaRes] = await Promise.allSettled([
        getStudents(),
        getBadgeTypes(),
        getAnalytics(),
      ]);

      if (stuRes.status === 'fulfilled') setStudents(stuRes.value || []);
      if (badgeRes.status === 'fulfilled') setBadgeTypes(badgeRes.value || []);
      if (anaRes.status === 'fulfilled') setAnalytics(anaRes.value || {});
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!formData.badge_type) return toast.error('Please choose a badge category');
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      await awardBadge({
        student_id: selectedStudent.id,
        badge_type: formData.badge_type,
        notes: formData.notes,
        awarded_by: formData.awarded_by || 'Teacher Alex',
      });

      toast.success(`Badge awarded to ${selectedStudent.name}! Notification queued for approval.`);
      setSelectedStudent(null);
      setFormData({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
      // Refresh analytics
      getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to award badge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Teacher Dashboard">
      {/* Top Banner Alert for Pending Approvals */}
      {analytics.pendingApproval > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
          border: '1.5px solid #c4b5fd',
          borderRadius: 'var(--radius)',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>✉️</span>
            <div>
              <strong style={{ color: '#5b21b6', fontSize: '15px' }}>
                {analytics.pendingApproval} Parent Email{analytics.pendingApproval > 1 ? 's' : ''} Awaiting Teacher Approval
              </strong>
              <p style={{ margin: '2px 0 0', color: '#6d28d9', fontSize: '13px' }}>
                Preview and authorize emails before they are dispatched to parents.
              </p>
            </div>
          </div>
          <Link href="/approvals" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Review Queue →
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#6366f1' }}>👥</div>
          <div>
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⭐</div>
          <div>
            <div className="stat-value">{badgeTypes.length} Types</div>
            <div className="stat-label">Active Badge Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>✉️</div>
          <div>
            <div className="stat-value">{analytics.totalSent || 0}</div>
            <div className="stat-label">Emails Dispatched</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>📈</div>
          <div>
            <div className="stat-value">{analytics.openRate || 0}%</div>
            <div className="stat-label">Parent Open Rate</div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/badges" className="btn btn-primary">
          ⭐ Award Badges
        </Link>
        <Link href="/students" className="btn btn-outline">
          👩‍🎓 Manage Students
        </Link>
        <Link href="/approvals" className="btn btn-outline">
          ✉️ Email Approvals ({analytics.pendingApproval || 0})
        </Link>
        <Link href="/analytics" className="btn btn-outline">
          📊 View Analytics
        </Link>
      </div>

      {/* Classroom Roster Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="section-label" style={{ marginBottom: 0 }}>Classroom Roster</h3>
            <p className="page-desc">Students enrolled in your class and ready for behavioral recognition</p>
          </div>
          <Link href="/students" className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
            + Add Student
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading classroom roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <h4>No students registered yet</h4>
            <p>Add your first student to start awarding behavior badges and communicating with parents.</p>
            <Link href="/students" className="btn btn-primary">
              Add Student Now
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-100)', color: 'var(--slate-500)', fontSize: '13px' }}>
                  <th style={{ padding: '14px 12px' }}>Student</th>
                  <th style={{ padding: '14px 12px' }}>Class / Grade</th>
                  <th style={{ padding: '14px 12px' }}>Parent / Guardian</th>
                  <th style={{ padding: '14px 12px' }}>Contact Email</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right' }}>Quick Award</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--slate-100)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{student.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className="badge-pill pill-slate">{student.class_name || 'Class 6'}</span>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--slate-700)' }}>{student.parent_name}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--slate-500)', fontSize: '13px' }}>{student.parent_email}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setFormData({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
                        }}
                      >
                        🏅 Award Badge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Award Badge Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '19px' }}>Award Badge</h3>
                <p className="page-desc">Celebrating <strong>{selectedStudent.name}</strong></p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', fontSize: '20px', color: 'var(--slate-400)', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAwardSubmit}>
              <div className="form-group">
                <label>Select Achievement Badge *</label>
                <select
                  value={formData.badge_type}
                  onChange={e => setFormData({ ...formData, badge_type: e.target.value })}
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {badgeTypes.map(b => (
                    <option key={b.type} value={b.type}>{b.emoji} {b.label} — {b.description || ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Personalized Teacher Note</label>
                <textarea
                  rows="3"
                  placeholder="Share what specific great action or effort they showed..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Awarded By</label>
                <input
                  type="text"
                  value={formData.awarded_by}
                  onChange={e => setFormData({ ...formData, awarded_by: e.target.value })}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--slate-500)', marginBottom: '18px' }}>
                ℹ️ Awarding this badge will generate an email draft in the <strong>Approvals</strong> queue for you to review before it is emailed to {selectedStudent.parent_name}.
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedStudent(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Queueing...' : 'Award & Draft Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
