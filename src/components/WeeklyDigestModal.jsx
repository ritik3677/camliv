import React, { useState } from 'react';

export default function WeeklyDigestModal({
  isOpen,
  digest,
  wordCount,
  isLoading,
  error,
  onRefresh,
  onClose
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!digest) return;
    navigator.clipboard?.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>✨</span>
            <h2 id="digest-modal-title" className="modal-title">
              Weekly Campus Briefing
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <span className="spinner" style={{ width: '28px', height: '28px', marginBottom: '1rem', color: 'var(--accent-primary)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Analyzing active deadlines and planning your week...
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Synthesizing priorities and checking for schedule conflicts.
            </p>
          </div>
        ) : error ? (
          <div className="alert-box alert-danger">
            <span aria-hidden="true">❌</span>
            <div style={{ flex: 1 }}>
              <strong>Could not generate weekly summary</strong>
              <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>{error}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem' }}
              onClick={onRefresh}
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Concise student brief &bull; {wordCount || 'Under 150'} words
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied!' : '📋 Copy text'}
              </button>
            </div>

            {/* Note: Rendering safely as plain text textContent/pre-wrap without dangerouslySetInnerHTML */}
            <div className="digest-box" tabIndex={0} aria-label="Weekly digest content">
              {digest}
            </div>
          </div>
        )}

        <div className="modal-actions">
          {!isLoading && !error && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRefresh}
              aria-label="Regenerate weekly briefing"
            >
              🔄 Refresh Brief
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

