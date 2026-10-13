// ============================================================
// FILE: frontend/pages/approvals.js
// Teacher Email Approval & Dispatch Queue
// ============================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getPendingEmails, getSentEmails, approveEmail, bulkApprove, bulkSend } from '../lib/api';
import toast from 'react-hot-toast';

export default function ApprovalsPage() {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [pending, sent] = await Promise.all([
        getPendingEmails(),
        getSentEmails(),
      ]);
      setPendingEmails(pending || []);
      setSentCount((sent || []).length);
    } catch {
      toast.error('Failed to load email queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSingle = async (id, studentName) => {
    try {
      await approveEmail(id);
      toast.success(`Email update for ${studentName || 'student'} approved!`);
      // Update local state to mark as approved
      setPendingEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve email');
    }
  };

  const handleBulkApprove = async () => {
    const unapproved = pendingEmails.filter(e => e.status === 'pending');
    if (unapproved.length === 0) return toast('All pending items are already approved!');

    setProcessing(true);
    try {
      await bulkApprove('all');
      toast.success(`Successfully approved ${unapproved.length} emails! Ready to send.`);
      setPendingEmails(prev => prev.map(e => ({ ...e, status: 'approved' })));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk approve failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkSend = async () => {
    const approvedCount = pendingEmails.filter(e => e.status === 'approved').length;
    if (approvedCount === 0) {
      return toast.error('No approved emails ready to send. Approve emails first!');
    }

    setProcessing(true);
    try {
      const result = await bulkSend();
      toast.success(`🚀 Dispatched ${result.sent} emails to parents!`);
      // Reload queue
      loadQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk sending failed');
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = pendingEmails.filter(e => e.status === 'pending').length;
  const approvedCount = pendingEmails.filter(e => e.status === 'approved').length;

  return (
    <Layout title="Email Approvals & Queue">
      {/* Overview Action Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius)',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
      }}>
        <div>
          <span style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
            Teacher Oversight Portal
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 4px', color: '#ffffff' }}>
            {pendingCount} Email{pendingCount !== 1 ? 's' : ''} Awaiting Review
          </h2>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {approvedCount > 0
              ? `${approvedCount} email${approvedCount !== 1 ? 's are' : ' is'} approved and ready to send to parents.`
              : 'Approve emails individually or all at once before sending to parents.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
            onClick={handleBulkApprove}
            disabled={processing || pendingCount === 0}
          >
            ✅ Approve All ({pendingCount})
          </button>
          <button
            className="btn btn-success"
            onClick={handleBulkSend}
            disabled={processing || approvedCount === 0}
            style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
          >
            🚀 Send Approved ({approvedCount})
          </button>
        </div>
      </div>

      {/* Email Queue List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="section-label" style={{ marginBottom: 0 }}>Review Queue</h3>
            <p className="page-desc">Ensure all communications meet your high standards</p>
          </div>
          <button className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={loadQueue}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading pending email notifications...</p>
          </div>
        ) : pendingEmails.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎉</div>
            <h4>All Caught Up!</h4>
            <p>There are no parent notification emails waiting for review right now. All recognized achievements have been reviewed and dispatched.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pendingEmails.map(email => {
              const studentName = email.students?.name || 'Student';
              const className = email.students?.class_name || 'Class 6';
              const parentName = email.students?.parent_name || 'Parent';
              const isApproved = email.status === 'approved';

              return (
                <div
                  key={email.id}
                  style={{
                    background: isApproved ? '#f0fdf4' : '#ffffff',
                    border: isApproved ? '1.5px solid #86efac' : '1px solid var(--slate-200)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1', minWidth: '280px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isApproved ? '#22c55e' : '#6366f1',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      {isApproved ? '✓' : '✉️'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '15px', color: 'var(--slate-900)' }}>{studentName}</strong>
                        <span className="badge-pill pill-violet" style={{ fontSize: '11px' }}>{className}</span>
                        <span className={`badge-pill ${isApproved ? 'pill-green' : 'pill-amber'}`} style={{ fontSize: '11px' }}>
                          {isApproved ? '✓ Approved' : '⏳ Pending Review'}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--slate-700)', marginTop: '4px', fontWeight: 500 }}>
                        {email.subject}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
                        Recipient: {parentName} ({email.parent_email}) · Queued {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                      onClick={() => setPreviewEmail(email)}
                    >
                      👁️ Preview
                    </button>

                    {!isApproved ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                        onClick={() => handleApproveSingle(email.id, studentName)}
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, padding: '0 8px' }}>
                        Ready to Send
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="modal-overlay" onClick={() => setPreviewEmail(null)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '19px' }}>Email Notification Preview</h3>
                <p className="page-desc">Recipient: {previewEmail.parent_email}</p>
              </div>
              <button onClick={() => setPreviewEmail(null)} style={{ background: 'none', fontSize: '20px', color: 'var(--slate-400)' }}>✕</button>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              <div><strong>Subject:</strong> {previewEmail.subject}</div>
              <div style={{ marginTop: '4px' }}><strong>To:</strong> {previewEmail.parent_email}</div>
            </div>

            {/* Rendered HTML Container */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#ffffff',
                marginBottom: '20px',
              }}
              dangerouslySetInnerHTML={{ __html: previewEmail.body }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setPreviewEmail(null)}>
                Close Preview
              </button>
              {previewEmail.status !== 'approved' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleApproveSingle(previewEmail.id, previewEmail.students?.name);
                    setPreviewEmail(null);
                  }}
                >
                  ✓ Approve Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
