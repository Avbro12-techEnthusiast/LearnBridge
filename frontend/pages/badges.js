// ============================================================
// FILE: frontend/pages/badges.js
// Dedicated Award Badges Studio with Live Email Preview
// ============================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getStudents, getBadgeTypes, awardBadge } from '../lib/api';
import toast from 'react-hot-toast';

const NOTE_SUGGESTIONS = [
  'Showed outstanding focus and completed tasks diligently.',
  'Readily assisted classmates with patience and great kindness.',
  'Shared original, creative ideas during classroom activities.',
  'Demonstrated inspiring teamwork and cooperative spirit.',
  'Asked insightful questions and displayed deep curiosity.',
  'Showed noticeable improvement and persevered through challenges.',
];

export default function BadgesPage() {
  const [students, setStudents] = useState([]);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBadgeType, setSelectedBadgeType] = useState('');
  const [notes, setNotes] = useState('');
  const [awardedBy, setAwardedBy] = useState('Teacher Alex');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentAwards, setRecentAwards] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, typesRes] = await Promise.all([
        getStudents(),
        getBadgeTypes(),
      ]);
      setStudents(stuRes || []);
      setBadgeTypes(typesRes || []);
      if (stuRes && stuRes.length > 0) setSelectedStudentId(stuRes[0].id);
      if (typesRes && typesRes.length > 0) setSelectedBadgeType(typesRes[0].type);
    } catch {
      toast.error('Failed to load students and badges');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const currentBadge = badgeTypes.find(b => b.type === selectedBadgeType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error('Please select a student');
    if (!selectedBadgeType) return toast.error('Please pick a badge');

    setSubmitting(true);
    try {
      const result = await awardBadge({
        student_id: selectedStudentId,
        badge_type: selectedBadgeType,
        notes: notes || 'Recognized for excellent attitude and effort.',
        awarded_by: awardedBy || 'Teacher Alex',
      });

      toast.success(`🎉 ${currentBadge?.label} badge awarded to ${selectedStudent?.name}! Notification queued for approval.`);

      setRecentAwards(prev => [
        {
          id: result.id || Date.now(),
          studentName: selectedStudent?.name,
          badgeEmoji: currentBadge?.emoji,
          badgeLabel: currentBadge?.label,
          notes: notes || 'Recognized for positive effort.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);

      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to award badge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Award Behavior Badges">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        
        {/* Left Form Studio */}
        <div className="card">
          <h3 className="page-title" style={{ fontSize: '20px', marginBottom: '4px' }}>Recognition Studio</h3>
          <p className="page-desc" style={{ marginBottom: '20px' }}>
            Acknowledge students for good behavior, leadership, and effort.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Student */}
            <div className="form-group">
              <label>1. Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                required
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.class_name || 'Class 6'}) — Parent: {s.parent_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Choose Badge */}
            <div className="form-group">
              <label style={{ marginBottom: '10px' }}>2. Choose Badge Category *</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
              }}>
                {badgeTypes.map(badge => {
                  const isSelected = selectedBadgeType === badge.type;
                  return (
                    <div
                      key={badge.type}
                      onClick={() => setSelectedBadgeType(badge.type)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--violet)' : '1px solid var(--slate-200)',
                        background: isSelected ? 'var(--violet-pale)' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '4px' }}>{badge.emoji}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--violet-dark)' : 'var(--slate-800)' }}>
                        {badge.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--slate-500)', marginTop: '2px', lineHeight: 1.2 }}>
                        {badge.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Personalized Teacher Note */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>3. Personalized Teacher Note</label>
              <textarea
                rows="3"
                placeholder="Describe what specific action the student took..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />

              {/* Quick suggestion prompt chips */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Prompt Suggestions:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {NOTE_SUGGESTIONS.map((sug, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setNotes(sug)}
                      style={{
                        background: 'var(--slate-100)',
                        color: 'var(--slate-700)',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      💡 {sug.substring(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Teacher Signature */}
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Awarded by Teacher Name</label>
              <input
                type="text"
                value={awardedBy}
                onChange={e => setAwardedBy(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'Drafting & Queuing...' : `🏅 Award ${currentBadge?.label || 'Badge'} to ${selectedStudent?.name || 'Student'}`}
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Parent Email Preview */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                👁️ Live Parent Email Preview
              </h4>
              <span className="badge-pill pill-violet">Auto-Generated Draft</span>
            </div>

            {/* Email Shell */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Email Client Subject Header */}
              <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                <div><strong>To:</strong> {selectedStudent?.parent_email || 'parent@example.com'}</div>
                <div style={{ marginTop: '2px' }}>
                  <strong>Subject:</strong> 🌟 {selectedStudent?.name || 'Student'} earned 1 badge today!
                </div>
              </div>

              {/* Email Content Header */}
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '24px 20px', color: '#ffffff' }}>
                <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>Student Progress Update</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '20px', color: '#ffffff' }}>
                  {selectedStudent?.name || 'Student'} earned badges! 🎉
                </h3>
              </div>

              {/* Email Content Body */}
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px' }}>
                  Dear {selectedStudent?.parent_name || 'Parent'},
                </p>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  We are delighted to share that <strong>{selectedStudent?.name || 'your student'}</strong> has received the following behavior badge from teacher <strong>{awardedBy}</strong>:
                </p>

                {/* Badge Table */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #ede9fe',
                  borderRadius: '8px',
                  padding: '12px',
                  margin: '14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{ fontSize: '32px' }}>{currentBadge?.emoji || '⭐'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                      {currentBadge?.label || 'Achievement'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {notes || 'Recognized for excellent classroom contribution!'}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Today</span>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Keep encouraging {selectedStudent?.name || 'them'} at home. Small celebrations make a big difference!
                </p>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
                  Warm regards,<br />
                  <strong style={{ color: '#334155' }}>{awardedBy}</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '12px', margin: 0 }}>
              🔒 Sent safely after you confirm in the <strong>Approvals</strong> tab. Includes tracking pixel to observe opens.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Awards Section */}
      {recentAwards.length > 0 && (
        <div className="card" style={{ marginTop: '28px' }}>
          <h4 className="section-label">Badges Awarded in this Session</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAwards.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{item.badgeEmoji}</span>
                  <div>
                    <strong style={{ color: 'var(--slate-900)', fontSize: '14px' }}>{item.studentName}</strong>
                    <span style={{ color: 'var(--slate-500)', fontSize: '13px', marginLeft: '8px' }}>— {item.badgeLabel}</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--slate-600)' }}>{item.notes}</p>
                  </div>
                </div>
                <span className="badge-pill pill-violet" style={{ fontSize: '11px' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
