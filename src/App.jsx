import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import SmartInput from './components/SmartInput.jsx';
import AttentionBanner from './components/AttentionBanner.jsx';
import ControlsBar from './components/ControlsBar.jsx';
import EventCard from './components/EventCard.jsx';
import CalendarView from './components/CalendarView.jsx';
import ManualEventModal from './components/ManualEventModal.jsx';
import WeeklyDigestModal from './components/WeeklyDigestModal.jsx';
import Toast from './components/Toast.jsx';

import {
  loadSavedEvents,
  saveEvents,
  loadSavedTheme,
  saveTheme
} from './utils/storage.js';
import { computeEventStatus } from './utils/status.js';
import { detectConflicts } from './utils/conflict.js';
import { downloadIcsFile } from './utils/ics.js';

export default function App() {
  const [events, setEvents] = useState(() => loadSavedEvents());
  const [theme, setTheme] = useState(() => loadSavedTheme());

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-asc');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Modals & feedback
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [digestContent, setDigestContent] = useState('');
  const [digestWordCount, setDigestWordCount] = useState(0);
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Persist events whenever changed
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Debounce search input (150ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Compute conflict map across all events (pure memoized computation)
  const conflictMap = useMemo(() => {
    return detectConflicts(events);
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events.filter((ev) => {
      // Search filter
      if (debouncedSearch) {
        const titleMatch = (ev.title || '').toLowerCase().includes(debouncedSearch);
        const venueMatch = (ev.venue || '').toLowerCase().includes(debouncedSearch);
        const catMatch = (ev.category || '').toLowerCase().includes(debouncedSearch);
        if (!titleMatch && !venueMatch && !catMatch) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && ev.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All') {
        const status = computeEventStatus(ev, now);
        if (status !== statusFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-asc') {
        const dateA = a.date || '9999-99-99';
        const dateB = b.date || '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '').localeCompare(b.time || '');
      } else if (sortBy === 'date-desc') {
        const dateA = a.date || '0000-00-00';
        const dateB = b.date || '0000-00-00';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.time || '').localeCompare(a.time || '');
      } else if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [events, debouncedSearch, categoryFilter, statusFilter, sortBy]);

  // Event handlers
  const handleEventsExtracted = useCallback((newEvents) => {
    setEvents((prev) => [...newEvents, ...prev]);
    setToastMessage(`Successfully extracted ${newEvents.length} event(s)!`);
  }, []);

  const handleSaveManualEvent = useCallback((eventData) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === eventData.id);
      if (idx !== -1) {
        // Edit existing
        const copy = [...prev];
        copy[idx] = eventData;
        return copy;
      }
      // Add new
      return [eventData, ...prev];
    });
    setToastMessage(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
    setEditingEvent(null);
  }, [editingEvent]);

  const handleDeleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setToastMessage('Event deleted.');
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setIsManualModalOpen(true);
  }, []);

  const handleExportAll = useCallback(() => {
    if (filteredEvents.length === 0) return;
    downloadIcsFile(filteredEvents, 'camliv-schedule.ics');
    setToastMessage(`Exported ${filteredEvents.length} event(s) to .ics file.`);
  }, [filteredEvents]);

  // Weekly AI briefing
  const handleFetchDigest = async () => {
    setIsDigestOpen(true);
    setIsDigestLoading(true);
    setDigestError(null);

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          today: todayStr
        })
      });

      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch { /* ignore */ }
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setDigestContent(data.digest || '');
      setDigestWordCount(data.wordCount || 0);
    } catch (err) {
      console.error('Digest fetch error:', err);
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? 'Network connection lost. Please check your internet.'
        : err.message || 'Failed to fetch weekly digest.';
      setDigestError(msg);
    } finally {
      setIsDigestLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenDigest={handleFetchDigest}
        onOpenAddModal={() => {
          setEditingEvent(null);
          setIsManualModalOpen(true);
        }}
        isDigestLoading={isDigestLoading}
      />

      <main role="main">
        {/* Smart Input Parser */}
        <SmartInput
          existingEvents={events}
          onEventsExtracted={handleEventsExtracted}
          onOpenAddModal={() => {
            setEditingEvent(null);
            setIsManualModalOpen(true);
          }}
        />

        {/* Needs Attention Today */}
        <AttentionBanner
          events={events}
          conflictMap={conflictMap}
          onEditEvent={handleEditEvent}
        />

        {/* Controls: Search, Filters, View Mode */}
        <ControlsBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={events.length}
          filteredCount={filteredEvents.length}
          onExportAll={handleExportAll}
        />

        {/* Content View: List or Calendar */}
        {viewMode === 'calendar' ? (
          <CalendarView
            events={filteredEvents}
            conflictMap={conflictMap}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className="empty-state" role="status">
                <span className="empty-icon" aria-hidden="true">📭</span>
                <h3 className="empty-title">
                  {events.length === 0
                    ? 'Your CamLiv pulse is clear!'
                    : 'No matching events found'}
                </h3>
                <p className="empty-description">
                  {events.length === 0
                    ? 'Paste WhatsApp group notices, exam dates, or club announcements above, or click "Try a sample notice" to see how it works.'
                    : 'Try adjusting your search keywords, category filter, or status filter.'}
                </p>
                {events.length === 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingEvent(null);
                      setIsManualModalOpen(true);
                    }}
                  >
                    ➕ Add Your First Event
                  </button>
                )}
              </div>
            ) : (
              <div className="events-grid" role="region" aria-label="Campus events list">
                {filteredEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    conflictMap={conflictMap}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Manual Add / Edit Modal */}
      <ManualEventModal
        isOpen={isManualModalOpen}
        initialEvent={editingEvent}
        onSave={handleSaveManualEvent}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingEvent(null);
        }}
      />

      {/* Weekly AI Digest Modal */}
      <WeeklyDigestModal
        isOpen={isDigestOpen}
        digest={digestContent}
        wordCount={digestWordCount}
        isLoading={isDigestLoading}
        error={digestError}
        onRefresh={handleFetchDigest}
        onClose={() => setIsDigestOpen(false)}
      />

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}

