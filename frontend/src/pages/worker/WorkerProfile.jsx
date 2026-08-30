import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, User, ArrowLeft, MessageSquare, Award, CheckCircle2 } from 'lucide-react';
import { workerService } from '../../services/workerService';
import { StarRating } from '../../components/common/StarRating';

export const WorkerProfile = () => {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await workerService.getProfile(id);
        setProfileData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load worker profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading worker profile and reviews...
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'Worker profile not found.'}</p>
        <Link to="/worker/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { worker, reviews, averageRating, totalReviews } = profileData;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/worker/dashboard"
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
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="page-title">Worker Profile & Performance</h1>
        <p className="page-subtitle">Actual ratings and verified reviews submitted by customers upon ticket resolution.</p>
      </div>

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
              }}
            >
              {worker.name?.charAt(0) || 'W'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {worker.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {worker.email} • Member since {new Date(worker.createdAt).toLocaleDateString()}
              </div>
              {worker.workerBio && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {worker.workerBio}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              background: 'var(--bg-alt)',
              padding: '1rem 1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {averageRating > 0 ? averageRating : '5.0'}
            </div>
            <div style={{ margin: '0.35rem 0' }}>
              <StarRating rating={Math.round(averageRating || 5)} readonly size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>

        {worker.workerSkills && worker.workerSkills.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Certified Support Skills
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {worker.workerSkills.map((s, idx) => (
                <span key={idx} className="badge badge-low">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Reviews List */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="var(--primary)" />
          Verified Customer Feedback ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Star size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Reviews Yet</p>
            <p style={{ fontSize: '0.82rem' }}>Reviews will appear here as customers rate completed requests.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <div
                key={r._id}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {r.customer?.name?.charAt(0) || 'C'}
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {r.customer?.name || 'Customer'}
                    </strong>
                    {r.ticket && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        on ticket {r.ticket.ticketNumber}
                      </span>
                    )}
                  </div>
                  <StarRating rating={r.rating} readonly size={16} />
                </div>

                {r.comment && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0.5rem 0' }}>
                    "{r.comment}"
                  </p>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
