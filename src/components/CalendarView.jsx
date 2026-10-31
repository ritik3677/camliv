import React, { useState } from 'react';
import { getMonthCalendarDays, formatFriendlyTime } from '../utils/date.js';
import { downloadIcsFile } from '../utils/ics.js';

export default function CalendarView({
  events,
  conflictMap,
  onEditEvent,
  onDeleteEvent
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const pad = (n) => String(n).padStart(2, '0');
    setSelectedDate(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  };

  // Group events by date string: 'YYYY-MM-DD' -> Array<event>
  const eventsByDate = {};
  for (const ev of events) {
    if (ev.date) {
      const d = ev.date.trim();
      if (!eventsByDate[d]) eventsByDate[d] = [];
      eventsByDate[d].push(ev);
    }
  }

  const calendarDays = getMonthCalendarDays(currentYear, currentMonth, today);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <div className="calendar-wrapper" aria-label="Monthly event calendar">
      <div className="calendar-header">
        <h2 className="calendar-month-title">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            onClick={handleResetToday}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            ◀
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="calendar-grid-weekdays" aria-hidden="true">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid-days" role="grid" aria-label={`Calendar for ${monthNames[currentMonth]} ${currentYear}`}>
        {calendarDays.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const isSelected = selectedDate === cell.dateStr;

          return (
            <div
              key={`${cell.dateStr}-${idx}`}
              className={`calendar-cell ${!cell.isCurrentMonth ? 'is-other-month' : ''} ${cell.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelectedDate(cell.dateStr)}
              role="gridcell"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDate(cell.dateStr);
                }
              }}
              aria-label={`${cell.dateStr}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ''}`}
            >
              <span className="cell-day-num">{cell.dayNum}</span>

              <div className="cell-events-list">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className="cell-event-chip"
                    title={`${ev.time ? ev.time + ' ' : ''}${ev.title}`}
                  >
                    {ev.time ? `${ev.time} ` : ''}{ev.title}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer */}
      {selectedDate && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Agenda for {selectedDate}
            </h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setSelectedDate(null)}
            >
              Close
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No campus events scheduled on this date.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedEvents.map((ev) => {
                const hasConflict = !!conflictMap[ev.id];
                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                          {ev.category}
                        </span>
                        {hasConflict && (
                          <span className="badge" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: '0.7rem' }}>
                            ⚠️ Conflict
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          🕒 {formatFriendlyTime(ev.time)}
                        </span>
                        {ev.venue && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📍 {ev.venue}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {ev.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => downloadIcsFile(ev)}
                      >
                        📅 .ics
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => onEditEvent(ev)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

