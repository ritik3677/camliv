import React from 'react';
import { computeEventStatus } from '../utils/status.js';
import { formatFriendlyTime } from '../utils/date.js';
import { downloadIcsFile } from '../utils/ics.js';

export default function AttentionBanner({
  events,
  conflictMap,
  onEditEvent
}) {
  const now = new Date();

  // Find events needing attention: Today and Urgent (within 48h)
  const attentionItems = events.filter((ev) => {
    const status = computeEventStatus(ev, now);
    return status === 'Today' || status === 'Urgent';
  });

  if (attentionItems.length === 0) {
    return null;
  }

  // Sort attention items: Today first, then Urgent
  const sortedItems = [...attentionItems].sort((a, b) => {
    const statusA = computeEventStatus(a, now);
    const statusB = computeEventStatus(b, now);
    if (statusA === 'Today' && statusB !== 'Today') return -1;
    if (statusB === 'Today' && statusA !== 'Today') return 1;
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <section className="attention-section" aria-labelledby="attention-title">
      <div className="attention-header">
        <h2 id="attention-title" className="attention-title">
          <span aria-hidden="true">🚨</span>
          Needs Attention Today & Soon
          <span className="attention-count" aria-label={`${sortedItems.length} urgent events`}>
            {sortedItems.length}
          </span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          High Priority
        </span>
      </div>

      <div className="attention-grid">
        {sortedItems.map((ev) => {
          const status = computeEventStatus(ev, now);
          const hasConflict = !!conflictMap[ev.id];

          return (
            <div
              key={ev.id}
              className={`event-card ${status === 'Today' ? 'card-today' : 'card-urgent'} ${hasConflict ? 'card-has-conflict' : ''}`}
              style={{ padding: '1rem' }}
            >
              <div className="card-top-row">
                <span className={`badge ${status === 'Today' ? 'badge-today' : 'badge-urgent'}`}>
                  {status === 'Today' ? '⚡ Today' : '🔥 Urgent (<48h)'}
                </span>
                <span className="badge badge-category">
                  {ev.category || 'Event'}
                </span>
              </div>

              {hasConflict && (
                <div className="conflict-banner" role="alert">
                  <span aria-hidden="true">⚠️</span>
                  <span>Time Conflict Detected</span>
                </div>
              )}

              <h3 className="card-title" style={{ fontSize: '0.975rem', marginBottom: '0.5rem' }}>
                {ev.title}
              </h3>

              <div className="card-details" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                <div className="detail-row">
                  <span className="detail-icon" aria-hidden="true">🕒</span>
                  <span>{formatFriendlyTime(ev.time)}</span>
                </div>
                {ev.venue && (
                  <div className="detail-row">
                    <span className="detail-icon" aria-hidden="true">📍</span>
                    <span>{ev.venue}</span>
                  </div>
                )}
              </div>

              <div className="card-footer" style={{ paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => onEditEvent(ev)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => downloadIcsFile(ev)}
                  title="Add to Calendar (.ics)"
                  aria-label={`Add ${ev.title} to calendar`}
                >
                  📅 +Calendar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

