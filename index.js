// ============================================================
// FILE: frontend/pages/index.js
// ============================================================
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getStudents, getBadgeTypes, awardBadge } from '../lib/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [students, setStudents] = useState([]);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });

  useEffect(() => {
    getStudents().then(setStudents).catch(() => toast.error('Failed to load students'));
    getBadgeTypes().then(setBadgeTypes).catch(() => toast.error('Failed to load badge definitions'));
  }, []);

  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!formData.badge_type) return toast.error('Please select a badge');

    try {
      await awardBadge({
        student_id: selectedStudent.id,
        ...formData
      });
      toast.success(`Badge successfully queued for ${selectedStudent.name}!`);
      setSelectedStudent(null);
      setFormData({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign badge');
    }
  };

  return (
    <Layout title="Classroom Roster">
      <div className="card">
        <h3 className="section-label">Active Students</h3>
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No students registered in this class database yet.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--slate-100)', color: 'var(--slate-500)', fontSize: '13px' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Class Group</th>
                <th style={{ padding: '12px' }}>Parent Email</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{student.name}</td>
                  <td style={{ padding: '12px' }}>{student.class_name || 'N/A'}</td>
                  <td style={{ padding: '12px', color: 'var(--slate-500)' }}>{student.parent_email}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedStudent(student)}>
                      🏅 Award Badge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inline Modal Window */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 className="page-title" style={{ marginBottom: '16px', fontSize: '18px' }}>Award Badge to {selectedStudent.name}</h3>
            <form onSubmit={handleAwardSubmit}>
              <div className="form-group">
                <label>Select Achievement Category</label>
                <select value={formData.badge_type} onChange={e => setFormData({ ...formData, badge_type: e.target.value })}>
                  <option value="">-- Choose Category --</option>
                  {badgeTypes.map(b => (
                    <option key={b.type} value={b.type}>{b.emoji} {b.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Personalized Teacher Note</label>
                <textarea rows="3" placeholder="Explain what great work they did..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Queue Notification</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}