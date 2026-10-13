// ============================================================
// FILE: frontend/pages/students.js
// Student Directory & Management
// ============================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getStudents, getStudent, createStudent, deleteStudent, getBadgeTypes, awardBadge } from '../lib/api';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class_name: '', parent_name: '', parent_email: '' });
  const [adding, setAdding] = useState(false);

  // View Badges Portfolio Modal State
  const [viewingStudent, setViewingStudent] = useState(null);
  const [studentBadges, setStudentBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Award Badge Modal State
  const [awardTarget, setAwardTarget] = useState(null);
  const [awardForm, setAwardForm] = useState({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuData, typesData] = await Promise.all([
        getStudents(),
        getBadgeTypes(),
      ]);
      setStudents(stuData || []);
      setBadgeTypes(typesData || []);
    } catch {
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.class_name || !newStudent.parent_name || !newStudent.parent_email) {
      return toast.error('Please fill in all required fields');
    }

    setAdding(true);
    try {
      const created = await createStudent(newStudent);
      toast.success(`Student ${created.name} added successfully!`);
      setStudents(prev => [...prev, created]);
      setShowAddModal(false);
      setNewStudent({ name: '', class_name: '', parent_name: '', parent_email: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from your class roster?`)) return;

    try {
      await deleteStudent(id);
      toast.success(`${name} was removed from the roster.`);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete student');
    }
  };

  const handleOpenBadges = async (student) => {
    setViewingStudent(student);
    setLoadingBadges(true);
    try {
      const details = await getStudent(student.id);
      setStudentBadges(details.badges || []);
    } catch {
      toast.error('Failed to load student badges');
      setStudentBadges([]);
    } finally {
      setLoadingBadges(false);
    }
  };

  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!awardForm.badge_type) return toast.error('Please select a badge category');
    if (!awardTarget) return;

    setAwarding(true);
    try {
      await awardBadge({
        student_id: awardTarget.id,
        badge_type: awardForm.badge_type,
        notes: awardForm.notes,
        awarded_by: awardForm.awarded_by || 'Teacher Alex',
      });
      toast.success(`Badge awarded to ${awardTarget.name}!`);
      setAwardTarget(null);
      setAwardForm({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to award badge');
    } finally {
      setAwarding(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.parent_email.toLowerCase().includes(search.toLowerCase()) ||
                          s.parent_name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name).filter(Boolean)));

  return (
    <Layout title="Students Directory">
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '540px' }}>
          <input
            type="text"
            placeholder="🔍 Search by student name, parent, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 2 }}
          />
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            style={{ flex: 1, minWidth: '140px' }}
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New Student
        </button>
      </div>

      {/* Students Table Card */}
      <div className="card">
        {loading ? (
          <div className="empty-state">
            <p>Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👨‍🎓</div>
            <h4>No students found</h4>
            <p>{search ? 'Try clearing your search query or filter.' : 'Your class roster is currently empty.'}</p>
            {search ? (
              <button className="btn btn-outline" onClick={() => { setSearch(''); setSelectedClass('all'); }}>Clear Filter</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Student</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-100)', color: 'var(--slate-500)', fontSize: '13px' }}>
                  <th style={{ padding: '14px 12px' }}>Student Name</th>
                  <th style={{ padding: '14px 12px' }}>Class / Section</th>
                  <th style={{ padding: '14px 12px' }}>Parent / Guardian</th>
                  <th style={{ padding: '14px 12px' }}>Parent Email</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{student.name}</div>
                          <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>ID: {student.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className="badge-pill pill-violet">{student.class_name || 'Class 6'}</span>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 500, color: 'var(--slate-700)' }}>
                      {student.parent_name}
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--slate-500)', fontSize: '13px' }}>
                      {student.parent_email}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleOpenBadges(student)}
                          title="View all badges earned"
                        >
                          📜 Portfolio
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setAwardTarget(student);
                            setAwardForm({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
                          }}
                        >
                          ⭐ Award
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          title="Delete student"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '19px' }}>Add New Student</h3>
                <p className="page-desc">Enroll a student into your classroom database</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', fontSize: '20px', color: 'var(--slate-400)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <div className="form-group">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Sen"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Class / Section *</label>
                <input
                  type="text"
                  placeholder="e.g. Class 6A"
                  value={newStudent.class_name}
                  onChange={e => setNewStudent({ ...newStudent, class_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Parent / Guardian Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sen"
                  value={newStudent.parent_name}
                  onChange={e => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Parent Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. rahul.sen@example.com"
                  value={newStudent.parent_email}
                  onChange={e => setNewStudent({ ...newStudent, parent_email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '22px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={adding}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Badges Portfolio Modal */}
      {viewingStudent && (
        <div className="modal-overlay" onClick={() => setViewingStudent(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '19px' }}>{viewingStudent.name}'s Badges</h3>
                <p className="page-desc">{viewingStudent.class_name} · Behavioral Recognition History</p>
              </div>
              <button onClick={() => setViewingStudent(null)} style={{ background: 'none', fontSize: '20px', color: 'var(--slate-400)' }}>✕</button>
            </div>

            {loadingBadges ? (
              <div className="empty-state">
                <p>Loading achievements...</p>
              </div>
            ) : studentBadges.length === 0 ? (
              <div className="empty-state">
                <div className="icon">⭐</div>
                <h4>No Badges Earned Yet</h4>
                <p>{viewingStudent.name} hasn't been awarded any badges yet. Celebrate their effort by awarding one today!</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const stu = viewingStudent;
                    setViewingStudent(null);
                    setAwardTarget(stu);
                    setAwardForm({ badge_type: '', notes: '', awarded_by: 'Teacher Alex' });
                  }}
                >
                  🏅 Award First Badge
                </button>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {studentBadges.map(b => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--slate-50)',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{b.badge_emoji || '⭐'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--slate-900)', fontSize: '15px' }}>{b.badge_label}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                          {new Date(b.awarded_at || b.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--slate-600)' }}>
                        {b.notes || 'Acknowledged for positive participation.'}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--violet)', fontWeight: 600, marginTop: '4px', display: 'inline-block' }}>
                        Awarded by {b.awarded_by || 'Teacher'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setViewingStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {awardTarget && (
        <div className="modal-overlay" onClick={() => setAwardTarget(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '19px' }}>Award Badge</h3>
                <p className="page-desc">To <strong>{awardTarget.name}</strong> ({awardTarget.class_name})</p>
              </div>
              <button onClick={() => setAwardTarget(null)} style={{ background: 'none', fontSize: '20px', color: 'var(--slate-400)' }}>✕</button>
            </div>

            <form onSubmit={handleAwardSubmit}>
              <div className="form-group">
                <label>Select Badge Category *</label>
                <select
                  value={awardForm.badge_type}
                  onChange={e => setAwardForm({ ...awardForm, badge_type: e.target.value })}
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
                  placeholder="Explain what great work or effort they demonstrated..."
                  value={awardForm.notes}
                  onChange={e => setAwardForm({ ...awardForm, notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Teacher Name</label>
                <input
                  type="text"
                  value={awardForm.awarded_by}
                  onChange={e => setAwardForm({ ...awardForm, awarded_by: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setAwardTarget(null)} disabled={awarding}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={awarding}>
                  {awarding ? 'Queueing...' : 'Award Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
