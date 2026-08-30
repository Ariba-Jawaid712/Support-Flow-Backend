import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  ShieldCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ConversationBox } from '../../components/chat/ConversationBox';
import { StarRating } from '../../components/common/StarRating';
import { Modal } from '../../components/common/Modal';
import { useSocket } from '../../context/SocketContext';

export const CustomerRequestDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { socket } = useSocket();

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await ticketService.getTicketById(id);
      setTicket(res.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  // Real-time status/priority/acceptance updates via Socket.IO
  useEffect(() => {
    if (!socket || !id) return;

    const handleStatusUpdate = ({ ticketId, status }) => {
      if (ticketId === id) {
        setTicket((prev) => (prev ? { ...prev, status } : prev));
      }
    };

    const handlePriorityUpdate = ({ ticketId, priority }) => {
      if (ticketId === id) {
        setTicket((prev) => (prev ? { ...prev, priority } : prev));
      }
    };

    const handleAccepted = ({ ticketId, worker }) => {
      if (ticketId === id) {
        loadTicket();
      }
    };

    socket.on('ticket-status-updated', handleStatusUpdate);
    socket.on('ticket-priority-updated', handlePriorityUpdate);
    socket.on('ticket-accepted', handleAccepted);

    return () => {
      socket.off('ticket-status-updated', handleStatusUpdate);
      socket.off('ticket-priority-updated', handlePriorityUpdate);
      socket.off('ticket-accepted', handleAccepted);
    };
  }, [socket, id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);

    try {
      await ticketService.submitReview(id, { rating, comment });
      setReviewSubmitted(true);
      setReviewModalOpen(false);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading request details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Request Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>{error || 'Unable to display request details.'}</p>
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved';
  const isFinalized = ticket.status === 'Resolved' || ticket.status === 'Rejected';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Requests
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {ticket.subject}
            </h1>
          </div>

          {/* 5-Star Review Button when Resolved */}
          {isResolved && !reviewSubmitted && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => setReviewModalOpen(true)}
            >
              <Star size={18} fill="#ffffff" /> Leave Worker Review (5-Star)
            </button>
          )}

          {reviewSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> Review Submitted
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ alignItems: 'start' }}>
        {/* Left 2 Cols: Details & Conversation */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Issue Details Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Issue Description
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {ticket.description}
            </p>

            {ticket.aiTriage && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
                  <Sparkles size={14} /> AI Triage Classification
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {ticket.aiTriage.summary} (Confidence: {Math.round((ticket.aiTriage.confidence || 0.85) * 100)}%)
                </div>
              </div>
            )}
          </div>

          {/* Live Conversation Box */}
          <ConversationBox ticketId={ticket._id} isClosed={isFinalized} />
        </div>

        {/* Right 1 Col: Worker & Status History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Assigned Worker Info */}
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Assigned Worker
            </h4>
            {ticket.assignedWorker ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {ticket.assignedWorker.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {ticket.assignedWorker.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ticket.assignedWorker.email}
                    </div>
                  </div>
                </div>

                {ticket.assignedWorker.workerSkills && ticket.assignedWorker.workerSkills.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Skills
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {ticket.assignedWorker.workerSkills.map((s, idx) => (
                        <span key={idx} className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Waiting for an approved worker to review and accept this request.
              </div>
            )}
          </div>

          {/* Timeline & Metadata */}
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Request Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Created On</span>
                <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
              </div>
              {ticket.acceptedAt && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Accepted On</span>
                  <strong>{new Date(ticket.acceptedAt).toLocaleString()}</strong>
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Resolved On</span>
                  <strong style={{ color: 'var(--success)' }}>{new Date(ticket.resolvedAt).toLocaleString()}</strong>
                </div>
              )}
              {ticket.rejectedAt && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Rejected On</span>
                  <strong style={{ color: 'var(--danger)' }}>{new Date(ticket.rejectedAt).toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Worker Performance"
      >
        {reviewError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {reviewError}
          </div>
        )}

        <form onSubmit={handleSubmitReview}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Rating (1 to 5 Stars) *
            </label>
            <StarRating rating={rating} onChange={setRating} size={32} />
          </div>

          <div className="form-group">
            <label className="form-label">Feedback / Review Comments (Optional)</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Share your experience regarding the speed, quality, and resolution provided by the worker..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit 5-Star Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
