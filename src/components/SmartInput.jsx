import React, { useState } from 'react';
import { SAMPLE_MESSY_TEXT } from '../utils/storage.js';
import { partitionCandidatesByDuplicate } from '../utils/duplicate.js';

export default function SmartInput({
  existingEvents,
  onEventsExtracted,
  onOpenAddModal
}) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [nonEventNotice, setNonEventNotice] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(null);

  const maxLength = 5000;

  const handleFillSample = () => {
    setInputText(SAMPLE_MESSY_TEXT);
    setErrorMessage(null);
    setNonEventNotice(false);
    setDuplicateNotice(null);
  };

  const handleClear = () => {
    setInputText('');
    setErrorMessage(null);
    setNonEventNotice(false);
    setDuplicateNotice(null);
  };

  const handleExtract = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMessage('Please paste or type campus notices or text before extracting.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setNonEventNotice(false);
    setDuplicateNotice(null);

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: trimmed,
          today: todayStr
        })
      });

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch {
          // ignore
        }
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const extractedEvents = Array.isArray(data.events) ? data.events : [];

      if (extractedEvents.length === 0) {
        // Non-event detection: greetings, chatter, or empty
        setNonEventNotice(true);
        return;
      }

      // Check for duplicates against existing events
      const { unique, duplicates } = partitionCandidatesByDuplicate(extractedEvents, existingEvents);

      if (duplicates.length > 0) {
        setDuplicateNotice({
          duplicates,
          unique,
          allExtracted: extractedEvents
        });
        // If there are unique events, we can also pass them or wait for user confirmation
      } else {
        // All events are fresh and unique!
        onEventsExtracted(extractedEvents);
        setInputText('');
      }
    } catch (err) {
      console.error('Extract error:', err);
      // Helpful error message for offline or failed requests
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? 'Network connection lost. Please check your internet connection.'
        : err.message || 'Failed to extract events. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAllWithDuplicates = () => {
    if (duplicateNotice?.allExtracted) {
      onEventsExtracted(duplicateNotice.allExtracted);
      setDuplicateNotice(null);
      setInputText('');
    }
  };

  const handleAcceptOnlyUnique = () => {
    if (duplicateNotice?.unique) {
      if (duplicateNotice.unique.length > 0) {
        onEventsExtracted(duplicateNotice.unique);
      }
      setDuplicateNotice(null);
      setInputText('');
    }
  };

  return (
    <section className="smart-input-section" aria-labelledby="smart-input-title">
      <div className="input-header">
        <h2 id="smart-input-title" className="input-title">
          <span aria-hidden="true">📥</span>
          Smart Notice Parser
        </h2>
        <button
          type="button"
          className="input-sample-btn"
          onClick={handleFillSample}
          aria-label="Paste a realistic sample WhatsApp forward with 4 events"
        >
          Try a sample notice
        </button>
      </div>

      <label htmlFor="smart-textarea" className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Paste campus notices, WhatsApp forwards, or posters here
      </label>
      <textarea
        id="smart-textarea"
        className="smart-textarea"
        placeholder="Paste messy WhatsApp forwards, emails, lecture schedules, or poster captions here... e.g. 'DBMS viva this Friday at 10 AM in Lab 302, Midterm tomorrow at 2 PM in Hall B...'"
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value.slice(0, maxLength));
          if (errorMessage) setErrorMessage(null);
          if (nonEventNotice) setNonEventNotice(false);
        }}
        rows={4}
        maxLength={maxLength}
        disabled={isLoading}
      />

      <div className="input-footer">
        <span className="char-counter" aria-live="polite">
          {inputText.length} / {maxLength} characters
        </span>

        <div className="input-actions">
          {inputText.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={isLoading || inputText.trim().length === 0}
            aria-label="Extract campus events from pasted text using AI"
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Extracting events...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">⚡</span>
                <span>Extract Events</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Non-events feedback */}
      {nonEventNotice && (
        <div className="alert-box alert-warning" role="status">
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>💬</span>
          <div style={{ flex: 1 }}>
            <strong>No campus events or deadlines detected in this text.</strong>
            <p style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
              The text seems like general chatter or greetings. Paste an announcement, schedule, or poster caption with dates/times, or click "Add Event" to add one manually.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            onClick={onOpenAddModal}
          >
            Add Manually
          </button>
        </div>
      )}

      {/* Duplicate detection warning */}
      {duplicateNotice && (
        <div className="alert-box alert-warning" role="alert">
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>Duplicate Notice Detected</strong>
            <p style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
              {duplicateNotice.duplicates.length} of the {duplicateNotice.allExtracted.length} extracted event(s) already exist in your schedule (e.g. "{duplicateNotice.duplicates[0]?.match?.title}").
            </p>
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {duplicateNotice.unique.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
                  onClick={handleAcceptOnlyUnique}
                >
                  Add Only {duplicateNotice.unique.length} New Event(s)
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
                onClick={handleAcceptAllWithDuplicates}
              >
                Add All Anyway
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setDuplicateNotice(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state with retry and manual fallback */}
      {errorMessage && (
        <div className="alert-box alert-danger" role="alert">
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>❌</span>
          <div style={{ flex: 1 }}>
            <strong>Extraction Error</strong>
            <p style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
              {errorMessage}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={handleExtract}
            >
              Retry
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={onOpenAddModal}
            >
              Add Manually
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

