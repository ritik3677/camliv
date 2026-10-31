import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  'Academic',
  'Exam',
  'Deadline',
  'Event',
  'Club',
  'Sports',
  'Placement',
  'Other'
];

export default function ManualEventModal({
  isOpen,
  initialEvent,
  onSave,
  onClose
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState(null);

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        setTitle(initialEvent.title || '');
        setCategory(initialEvent.category || 'Academic');
        setDate(initialEvent.date || '');
        setTime(initialEvent.time || '');
        setVenue(initialEvent.venue || '');
      } else {
        // Reset defaults
        const pad = (n) => String(n).padStart(2, '0');
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        setTitle('');
        setCategory('Academic');
        setDate(todayStr);
        setTime('10:00');
        setVenue('');
      }
      setError(null);
      // Auto focus title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialEvent]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Event title is required.');
      return;
    }

    const payload = {
      id: initialEvent?.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle,
      category,
      date: date.trim() || null,
      time: time.trim() || null,
      venue: venue.trim() || null,
      confidence: 1.0,
      uncertain_fields: [],
      createdAt: initialEvent?.createdAt || new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-event-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 id="manual-event-title" className="modal-title">
            {initialEvent ? 'Edit Campus Event' : 'Add Campus Event'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div className="alert-box alert-danger" role="alert" style={{ margin: 0, padding: '0.6rem 0.8rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="event-title-input" className="form-label">
              Event Title <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <input
              id="event-title-input"
              ref={titleInputRef}
              type="text"
              className="form-input"
              placeholder="e.g. Operating Systems Midterm Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="event-category-select" className="form-label">
                Category
              </label>
              <select
                id="event-category-select"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="event-venue-input" className="form-label">
                Venue / Location
              </label>
              <input
                id="event-venue-input"
                type="text"
                className="form-input"
                placeholder="e.g. Hall B / Google Classroom"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="event-date-input" className="form-label">
                Date (YYYY-MM-DD)
              </label>
              <input
                id="event-date-input"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-time-input" className="form-label">
                Time (HH:MM)
              </label>
              <input
                id="event-time-input"
                type="time"
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {initialEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

