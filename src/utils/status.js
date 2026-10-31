/**
 * Status computation logic for Campus Pulse events.
 * Categories:
 * - Expired: past date
 * - Today: scheduled for today
 * - Urgent: scheduled within the next 48 hours (excluding today)
 * - Upcoming: scheduled further out than 48 hours, or unscheduled
 */

/**
 * Format a Date object to YYYY-MM-DD in local time
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse an event date and optional time into a local Date object.
 * If time is absent, defaults to start of day (00:00:00) or end of day based on endOfDay flag.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string|null} [timeStr] - 'HH:MM' (24-hour)
 * @param {boolean} [endOfDay=false]
 * @returns {Date|null}
 */
export function parseEventDateTime(dateStr, timeStr = null, endOfDay = false) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hour = endOfDay ? 23 : 0;
  let minute = endOfDay ? 59 : 0;
  let second = endOfDay ? 59 : 0;

  if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
    const timeParts = timeStr.trim().split(':');
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      hour = h;
      minute = m;
      second = 0;
    }
  }

  return new Date(year, month, day, hour, minute, second, 0);
}

/**
 * Compute the status of an event.
 * Computed purely in code (NOT with AI).
 *
 * @param {{ date?: string|null, time?: string|null }} event
 * @param {Date|string|number} [now=new Date()] Reference time for deterministic testing
 * @returns {'Expired' | 'Today' | 'Urgent' | 'Upcoming'}
 */
export function computeEventStatus(event, now = new Date()) {
  if (!event || !event.date) {
    return 'Upcoming';
  }

  const ref = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (isNaN(ref.getTime())) {
    return 'Upcoming';
  }

  const todayKey = formatDateKey(ref);
  const eventDateKey = event.date.trim();

  // If date is before today, it's expired
  if (eventDateKey < todayKey) {
    return 'Expired';
  }

  // If date is today
  if (eventDateKey === todayKey) {
    return 'Today';
  }

  // Future date: check if within 48 hours
  const eventDateTime = parseEventDateTime(event.date, event.time, false);
  if (!eventDateTime) {
    return 'Upcoming';
  }

  const diffMs = eventDateTime.getTime() - ref.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If within 48 hours from reference time
  if (diffHours >= 0 && diffHours <= 48) {
    return 'Urgent';
  }

  return 'Upcoming';
}

/**
 * Check if an event needs attention today or urgently
 * @param {{ date?: string|null, time?: string|null }} event
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isNeedsAttention(event, now = new Date()) {
  const status = computeEventStatus(event, now);
  return status === 'Today' || status === 'Urgent';
}

/**
 * Metadata for rendering status badges accessibly
 */
export const STATUS_META = {
  Today: {
    label: 'Today',
    icon: '⚡',
    badgeClass: 'badge-today',
    ariaLabel: 'Status: Today - Happening today',
    description: 'Happening today'
  },
  Urgent: {
    label: 'Urgent',
    icon: '🔥',
    badgeClass: 'badge-urgent',
    ariaLabel: 'Status: Urgent - Within next 48 hours',
    description: 'Due within 48 hours'
  },
  Upcoming: {
    label: 'Upcoming',
    icon: '📅',
    badgeClass: 'badge-upcoming',
    ariaLabel: 'Status: Upcoming',
    description: 'Scheduled for later'
  },
  Expired: {
    label: 'Expired',
    icon: '⌛',
    badgeClass: 'badge-expired',
    ariaLabel: 'Status: Expired - Past event',
    description: 'Event has passed'
  }
};
