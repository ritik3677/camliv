import { describe, it, expect } from 'vitest';
import {
  formatFriendlyDate,
  formatFriendlyTime,
  resolveRelativeDate,
  getMonthCalendarDays
} from '../utils/date.js';

describe('Date Resolution & Formatting Logic', () => {
  // Saturday, Oct 31, 2026
  const mockNow = new Date(2026, 9, 31, 10, 0, 0);

  it('formats friendly date relative to today', () => {
    expect(formatFriendlyDate('2026-10-31', mockNow)).toContain('Today');
    expect(formatFriendlyDate('2026-11-01', mockNow)).toContain('Tomorrow');
    expect(formatFriendlyDate('2026-10-30', mockNow)).toContain('Yesterday');
    expect(formatFriendlyDate('2026-11-04', mockNow)).toContain('In 4 days');
  });

  it('formats friendly time from 24h to 12h AM/PM', () => {
    expect(formatFriendlyTime('09:00')).toBe('9:00 AM');
    expect(formatFriendlyTime('14:30')).toBe('2:30 PM');
    expect(formatFriendlyTime('00:15')).toBe('12:15 AM');
    expect(formatFriendlyTime('12:00')).toBe('12:00 PM');
    expect(formatFriendlyTime(null)).toBe('Time TBD');
  });

  it('resolves relative date keywords accurately', () => {
    expect(resolveRelativeDate('today', mockNow)).toBe('2026-10-31');
    expect(resolveRelativeDate('tomorrow', mockNow)).toBe('2026-11-01');
    expect(resolveRelativeDate('day_after_tomorrow', mockNow)).toBe('2026-11-02');
    expect(resolveRelativeDate('in 5 days', mockNow)).toBe('2026-11-05');
  });

  it('generates a full monthly calendar grid of 35 or 42 cells', () => {
    // October 2026 (starts on Thursday, 31 days)
    const days = getMonthCalendarDays(2026, 9, mockNow);
    expect(days.length % 7).toBe(0); // Multiple of 7
    expect(days.length).toBeGreaterThanOrEqual(35);

    // Verify today's cell is flagged
    const todayCell = days.find((d) => d.dateStr === '2026-10-31');
    expect(todayCell).toBeDefined();
    expect(todayCell.isToday).toBe(true);
    expect(todayCell.isCurrentMonth).toBe(true);
  });
});
