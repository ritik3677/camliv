import React from 'react';
import { formatFriendlyDate } from '../utils/date.js';

export default function Navbar({
  theme,
  onToggleTheme,
  onOpenDigest,
  onOpenAddModal,
  isDigestLoading
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const friendlyToday = formatFriendlyDate(todayStr);

  return (
    <header className="app-header" role="banner">
      <div className="brand-section">
        <div className="brand-icon" aria-hidden="true">
          ⚡
        </div>
        <div>
          <h1 className="brand-title">
            CamLiv
            <span className="badge-beta">v1.0</span>
          </h1>
          <p className="brand-subtitle">
            Never miss a campus deadline or event &bull; {friendlyToday}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="btn btn-urgent-digest"
          onClick={onOpenDigest}
          disabled={isDigestLoading}
          aria-label="What do I need to know this week? Generates an AI weekly briefing"
        >
          {isDigestLoading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Analyzing week...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">✨</span>
              <span>What do I need to know this week?</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenAddModal}
          aria-label="Add event manually"
        >
          <span aria-hidden="true">➕</span>
          <span>Add Event</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon-only"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  );
}

