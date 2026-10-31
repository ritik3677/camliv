/**
 * iCalendar (.ics) generation and download utilities for Campus Pulse.
 * Fully compliant with RFC 5545 specification.
 */

/**
 * Escape text for iCalendar fields (RFC 5545 section 3.3.11)
 * @param {string} text
 * @returns {string}
 */
export function escapeIcsText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Fold long lines according to RFC 5545 (max 75 octets per line).
 * @param {string} line
 * @returns {string}
 */
export function foldIcsLine(line) {
  if (!line || line.length <= 75) return line;
  const chunks = [];
  chunks.push(line.slice(0, 75));
  let remaining = line.slice(75);
  while (remaining.length > 74) {
    chunks.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  if (remaining.length > 0) {
    chunks.push(' ' + remaining);
  }
  return chunks.join('\r\n');
}

/**
 * Format a Date to UTC timestamp YYYYMMDDTHHMMSSZ
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatIcsTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Calculate the next day string YYYYMMDD for all-day events.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
function getNextDayStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
}

/**
 * Generate iCalendar VEVENT string for a single event
 * @param {Object} event
 * @param {string} [nowStamp]
 * @returns {string}
 */
export function generateVEvent(event, nowStamp = formatIcsTimestamp()) {
  if (!event) return '';

  const uid = event.id ? `${event.id}@campuspulse.app` : `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@campuspulse.app`;
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`
  ];

  if (event.date) {
    const cleanDate = event.date.replace(/-/g, '');
    if (event.time && event.time.includes(':')) {
      const [h, m] = event.time.split(':');
      const startHour = String(h).padStart(2, '0');
      const startMin = String(m).padStart(2, '0');
      const dtStart = `${cleanDate}T${startHour}${startMin}00`;

      // Default duration 1 hour
      const endHourNum = (parseInt(startHour, 10) + 1) % 24;
      const endHour = String(endHourNum).padStart(2, '0');
      const dtEnd = `${cleanDate}T${endHour}${startMin}00`;

      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    } else {
      // All day event: DTSTART;VALUE=DATE:YYYYMMDD, DTEND;VALUE=DATE:NextDay
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      lines.push(`DTEND;VALUE=DATE:${getNextDayStr(event.date)}`);
    }
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title || 'Campus Event')}`);

  const descParts = [];
  if (event.category) descParts.push(`Category: ${event.category}`);
  if (event.venue) descParts.push(`Venue: ${event.venue}`);
  if (event.uncertain_fields && event.uncertain_fields.length > 0) {
    descParts.push(`Note: Please verify ${event.uncertain_fields.join(', ')}.`);
  }
  descParts.push('Organized with Campus Pulse');

  lines.push(`DESCRIPTION:${escapeIcsText(descParts.join(' | '))}`);

  if (event.venue) {
    lines.push(`LOCATION:${escapeIcsText(event.venue)}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');

  return lines.map(foldIcsLine).join('\r\n');
}

/**
 * Generate complete .ics calendar string for one or multiple events
 * @param {Object|Array<Object>} events
 * @returns {string}
 */
export function generateIcsContent(events) {
  const eventList = Array.isArray(events) ? events : [events];
  const nowStamp = formatIcsTimestamp();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Pulse//Campus Event Organizer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const ev of eventList) {
    if (ev) {
      lines.push(generateVEvent(ev, nowStamp));
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generate a safe filename for an event .ics export
 * @param {string} [title='event']
 * @returns {string}
 */
export function getIcsFilename(title = 'campus-event') {
  const slug = (title || 'campus-event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);
  return `${slug || 'campus-event'}.ics`;
}

/**
 * Trigger browser download of an .ics file
 * @param {Object|Array<Object>} events
 * @param {string} [customFilename]
 */
export function downloadIcsFile(events, customFilename) {
  if (typeof window === 'undefined' || !window.document) return;

  const icsString = generateIcsContent(events);
  const isMultiple = Array.isArray(events) && events.length > 1;
  const firstTitle = Array.isArray(events) ? (events[0]?.title || 'events') : (events?.title || 'event');
  const filename = customFilename || (isMultiple ? 'campus-pulse-schedule.ics' : getIcsFilename(firstTitle));

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

