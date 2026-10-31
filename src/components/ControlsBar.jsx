import React from 'react';

const CATEGORIES = [
  'All',
  'Academic',
  'Exam',
  'Deadline',
  'Event',
  'Club',
  'Sports',
  'Placement',
  'Other'
];

const STATUSES = ['All', 'Today', 'Urgent', 'Upcoming', 'Expired'];

export default function ControlsBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  onExportAll
}) {
  return (
    <div className="controls-bar" role="search" aria-label="Event filters and view controls">
      <div className="controls-row-top">
        <div className="search-box-wrapper">
          <label htmlFor="event-search-input" className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Search events by title or venue
          </label>
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            id="event-search-input"
            type="text"
            className="search-input"
            placeholder="Search events, courses, halls..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}
        </div>

        <div className="view-and-sort">
          <label htmlFor="sort-select" className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Sort events
          </label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort events"
          >
            <option value="date-asc">Date (Earliest first)</option>
            <option value="date-desc">Date (Latest first)</option>
            <option value="category">Category</option>
            <option value="title">Title (A-Z)</option>
          </select>

          <div className="view-mode-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
            >
              📋 List
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => onViewModeChange('calendar')}
              aria-pressed={viewMode === 'calendar'}
            >
              📅 Month
            </button>
          </div>

          {filteredCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              onClick={onExportAll}
              title="Download all filtered events as an .ics calendar file"
            >
              📥 Export All (.ics)
            </button>
          )}
        </div>
      </div>

      {/* Filter by Category */}
      <div className="filters-pills-row" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
            role="tab"
            aria-selected={categoryFilter === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter by Status & Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Status:
          </span>
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
              style={{ fontSize: '0.725rem', padding: '0.2rem 0.55rem' }}
              onClick={() => onStatusChange(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing {filteredCount} of {totalCount} events
        </span>
      </div>
    </div>
  );
}

