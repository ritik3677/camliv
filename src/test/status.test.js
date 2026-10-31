import { describe, it, expect } from 'vitest';
import { computeEventStatus, isNeedsAttention } from '../utils/status.js';

describe('Event Status Logic', () => {
  // Reference date: Saturday, Oct 31, 2026, 11:00 AM
  const mockNow = new Date(2026, 9, 31, 11, 0, 0); // Month is 0-indexed: 9 = October

  it('marks past dates as Expired', () => {
    const event = { date: '2026-10-30', time: '14:00' };
    expect(computeEventStatus(event, mockNow)).toBe('Expired');
  });

  it('marks dates far in the past as Expired', () => {
    const event = { date: '2025-01-01', time: null };
    expect(computeEventStatus(event, mockNow)).toBe('Expired');
  });

  it('marks events on today as Today', () => {
    const event = { date: '2026-10-31', time: '15:30' };
    expect(computeEventStatus(event, mockNow)).toBe('Today');
  });

  it('marks events today without a time as Today', () => {
    const event = { date: '2026-10-31', time: null };
    expect(computeEventStatus(event, mockNow)).toBe('Today');
  });

  it('marks events within the next 48 hours as Urgent', () => {
    // Tomorrow Nov 1 at 14:00 (approx 27 hours away)
    const event1 = { date: '2026-11-01', time: '14:00' };
    expect(computeEventStatus(event1, mockNow)).toBe('Urgent');

    // Day after tomorrow Nov 2 at 10:00 (approx 47 hours away)
    const event2 = { date: '2026-11-02', time: '10:00' };
    expect(computeEventStatus(event2, mockNow)).toBe('Urgent');
  });

  it('marks events beyond 48 hours as Upcoming', () => {
    // 5 days later: Nov 5
    const event = { date: '2026-11-05', time: '10:00' };
    expect(computeEventStatus(event, mockNow)).toBe('Upcoming');
  });

  it('marks unscheduled events (no date) as Upcoming', () => {
    const event = { date: null, time: null };
    expect(computeEventStatus(event, mockNow)).toBe('Upcoming');
  });

  it('correctly determines isNeedsAttention for Today and Urgent items', () => {
    expect(isNeedsAttention({ date: '2026-10-31' }, mockNow)).toBe(true);
    expect(isNeedsAttention({ date: '2026-11-01' }, mockNow)).toBe(true);
    expect(isNeedsAttention({ date: '2026-11-10' }, mockNow)).toBe(false);
    expect(isNeedsAttention({ date: '2026-10-25' }, mockNow)).toBe(false);
  });
});

