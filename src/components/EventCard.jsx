import React from 'react';
import { computeEventStatus, STATUS_META } from '../utils/status.js';
import { formatFriendlyDate, formatFriendlyTime } from '../utils/date.js';
import { downloadIcsFile } from '../utils/ics.js';
import { getConflictWarning } from '../utils/conflict.js';

export default function EventCard({
  event,
  conflictMap,
  onEdit,
  onDelete
}) {
  const now = new Date();
  const status = computeEventStatus(event, now);
  const statusMeta = STATUS_META[status] || STATUS_META.Upcoming;

  const conflictWarning = getConflictWarning(event.id, conflictMap);
  const isConflict = !!conflictWarning;

  const isLowConfidence = typeof event.confidence === 'number' && event.confidence < 0.8;
  const hasUncertainFields = Array.isArray(event.uncertain_fields) && event.uncertain_fields.length > 0;
  const showUncertainWarning = isLowConfidence || hasUncertainFields;

  const categoryIcons = {
    Academic: '📚',
    Exam: '📝',
    Deadline: '⏰',
    Event: '🎉',
    Club: '🤝',
    Sports: '⚽',
    Placement: '💼',
    Other: '📌'
  };

  const catIcon = categoryIcons[event.category] || '📌';

  return (
    <article
      className={`event-card ${status === 'Today' ? 'card-today' : ''} ${status === 'Urgent' ? 'card-urgent' : ''} ${isConflict ? 'card-has-conflict' : ''}`}
      aria-labelledby={`event-title-${event.id}`}
    >
      <div>
        <div className="card-top-row">
          <div className="card-badges">
            {/* Status badge with text + icon for accessibility */}
            <span
              className={`badge ${statusMeta.badgeClass}`}
              aria-label={statusMeta.ariaLabel}
            >
              <span aria-hidden="true">{statusMeta.icon}</span>
              <span>{statusMeta.label}</span>
            </span>

            {/* Category badge */}
            <span className="badge badge-category">
              <span aria-hidden="true">{catIcon}</span>
              <span>{event.category || 'Other'}</span>
            </span>
          </div>

          {typeof event.confidence === 'number' && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
              title={`AI Extraction confidence: ${Math.round(event.confidence * 100)}%`}
            >
              {Math.round(event.confidence * 100)}% conf
            </span>
          )}
        </div>

        {/* Conflict Warning */}
        {isConflict && (
          <div className="conflict-banner" role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Uncertain fields amber warning */}
        {showUncertainWarning && (
          <div className="uncertain-banner" role="status">
            <span aria-hidden="true">⚠️</span>
            <span>
              Review needed: {hasUncertainFields ? event.uncertain_fields.join(', ') : 'details estimated'}
            </span>
          </div>
        )}

        <h3 id={`event-title-${event.id}`} className="card-title">
          {event.title}
        </h3>

        <div className="card-details">
          <div className="detail-row">
            <span className="detail-icon" aria-hidden="true">📅</span>
            <span>{formatFriendlyDate(event.date, now)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-icon" aria-hidden="true">🕒</span>
            <span>{formatFriendlyTime(event.time)}</span>
          </div>

          {event.venue && (
            <div className="detail-row">
              <span className="detail-icon" aria-hidden="true">📍</span>
              <span>{event.venue}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="card-actions-left">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            onClick={() => downloadIcsFile(event)}
            aria-label={`Download calendar .ics file for ${event.title}`}
            title="Download .ics file"
          >
            📅 .ics
          </button>
        </div>

        <div className="card-actions-right">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            onClick={() => onEdit(event)}
            aria-label={`Edit ${event.title}`}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: 'var(--danger-text)' }}
            onClick={() => onDelete(event.id)}
            aria-label={`Delete ${event.title}`}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </article>
  );
}
