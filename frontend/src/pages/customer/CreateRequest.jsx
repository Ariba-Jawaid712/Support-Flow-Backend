import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { PriorityBadge } from '../../components/common/Badge';

export const CreateRequest = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Local deterministic rule-based live analysis preview
  const getLiveTriage = () => {
    const text = `${subject} ${description}`.toLowerCase();
    
    let assessedCat = 'General';
    if (text.includes('refund') || text.includes('invoice') || text.includes('payment') || text.includes('charge')) {
      assessedCat = 'Billing';
    } else if (text.includes('outage') || text.includes('system down') || text.includes('security breach')) {
      assessedCat = 'Urgent Support';
    } else if (text.includes('password') || text.includes('login') || text.includes('2fa') || text.includes('locked')) {
      assessedCat = 'Account';
    } else if (text.includes('wifi') || text.includes('network') || text.includes('connection') || text.includes('dns')) {
      assessedCat = 'Network';
    } else if (text.includes('laptop') || text.includes('screen') || text.includes('battery') || text.includes('hardware')) {
      assessedCat = 'Hardware';
    } else if (text.includes('bug') || text.includes('crash') || text.includes('error') || text.includes('failed')) {
      assessedCat = 'Technical';
    }

    let assessedPriority = 'Medium';
    if (text.includes('outage') || text.includes('system down') || text.includes('emergency') || text.includes('data loss')) {
      assessedPriority = 'Urgent';
    } else if (text.includes('blocking') || text.includes('cannot access') || text.includes('asap')) {
      assessedPriority = 'Critical';
    } else if (text.includes('crash') || text.includes('error') || text.includes('broken')) {
      assessedPriority = 'High';
    } else if (text.includes('minor') || text.includes('typo') || text.includes('suggestion')) {
      assessedPriority = 'Low';
    }

    return { category: assessedCat, priority: assessedPriority };
  };

  const triage = getLiveTriage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both subject and description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await ticketService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category: category !== 'General' ? category : triage.category,
      });

      navigate(`/requests/${res.ticket._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="page-title">Submit a Service Request</h1>
        <p className="page-subtitle">Describe your inquiry or problem. Our automated triage will classify and route it to skilled workers.</p>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid #fca5a5',
            color: 'var(--danger)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} flexShrink={0} />
          <span>{error}</span>
        </div>
      )}

      {/* Live AI Triage Assistant Card */}
      <div className="ai-triage-card">
        <div className="ai-triage-header">
          <Sparkles size={18} color="var(--primary)" />
          <span>Local Rule-Based AI Triage Assistant</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Real-time deterministic assessment based on your issue description:
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
              Assessed Category
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {triage.category}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
              Initial Priority
            </span>
            <PriorityBadge priority={triage.priority} />
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject / Problem Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Unable to connect to VPN server or Database timeout"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category (Optional)</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">Auto-Detect via AI Triage (Recommended)</option>
              <option value="Technical">Technical / Bug</option>
              <option value="Billing">Billing & Payments</option>
              <option value="Account">Account Access</option>
              <option value="Network">Network & Connectivity</option>
              <option value="Hardware">Hardware / Device</option>
              <option value="Urgent Support">Urgent Support</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-control"
              required
              rows={6}
              placeholder="Please provide full details about the issue, error messages received, steps to reproduce, or service requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !subject.trim() || !description.trim()}
            >
              <Send size={16} />
              {loading ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
