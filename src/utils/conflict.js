/**
 * Conflict detection utility for Campus Pulse.
 * Identifies events that occur on the same date with overlapping times.
 */

/**
 * Convert HH:MM 24h string to minutes from midnight.
 * @param {string} timeStr - "HH:MM"
 * @returns {number|null}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Check if two specific events have a scheduling conflict.
 * Two events conflict if:
 * 1. Both have valid dates and are on the exact same date.
 * 2. Both have valid times, and their intervals overlap (assuming default 60 min duration).
 * 3. Or both are high-stakes exams on the same date.
 *
 * @param {Object} eventA
 * @param {Object} eventB
 * @param {number} [durationMinutes=60] Default estimated duration
 * @returns {boolean}
 */
export function isEventConflict(eventA, eventB, durationMinutes = 60) {
  if (!eventA || !eventB) return false;
  if (!eventA.date || !eventB.date) return false;
  if (eventA.id && eventB.id && eventA.id === eventB.id) return false;

  // Must be on the exact same date
  if (eventA.date.trim() !== eventB.date.trim()) return false;

  const minA = timeToMinutes(eventA.time);
  const minB = timeToMinutes(eventB.time);

  // If both have specific times
  if (minA !== null && minB !== null) {
    const endA = minA + durationMinutes;
    const endB = minB + durationMinutes;
    // Two intervals [minA, endA) and [minB, endB) overlap if: minA < endB && minB < endA
    return minA < endB && minB < endA;
  }

  // If both are Exams on the exact same date without specified times, flag as conflict
  if (eventA.category === 'Exam' && eventB.category === 'Exam') {
    return true;
  }

  return false;
}

/**
 * Analyze an array of events and build a map of conflicts.
 *
 * @param {Array<Object>} events
 * @param {number} [durationMinutes=60]
 * @returns {Record<string, Array<{ id: string, title: string, time: string|null, date: string }>>}
 */
export function detectConflicts(events = [], durationMinutes = 60) {
  const conflictMap = {};

  if (!Array.isArray(events) || events.length < 2) {
    return conflictMap;
  }

  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    const aId = a.id || `event-${i}`;

    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      const bId = b.id || `event-${j}`;

      if (isEventConflict(a, b, durationMinutes)) {
        if (!conflictMap[aId]) conflictMap[aId] = [];
        if (!conflictMap[bId]) conflictMap[bId] = [];

        conflictMap[aId].push({
          id: bId,
          title: b.title || 'Untitled Event',
          time: b.time || null,
          date: b.date
        });

        conflictMap[bId].push({
          id: aId,
          title: a.title || 'Untitled Event',
          time: a.time || null,
          date: a.date
        });
      }
    }
  }

  return conflictMap;
}

/**
 * Get human-readable warning message for an event's conflicts
 * @param {string} eventId
 * @param {Record<string, Array<any>>} conflictMap
 * @returns {string|null}
 */
export function getConflictWarning(eventId, conflictMap = {}) {
  const conflicts = conflictMap[eventId];
  if (!conflicts || conflicts.length === 0) return null;

  if (conflicts.length === 1) {
    const other = conflicts[0];
    const timeInfo = other.time ? ` at ${other.time}` : '';
    return `Schedule conflict with "${other.title}"${timeInfo}`;
  }

  return `Schedule conflict with ${conflicts.length} other events`;
}

