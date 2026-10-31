import { describe, it, expect } from 'vitest';
import { isEventConflict, detectConflicts, getConflictWarning, timeToMinutes } from '../utils/conflict.js';

describe('Conflict Detection Logic', () => {
  it('converts HH:MM strings to minutes from midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('01:30')).toBe(90);
    expect(timeToMinutes('14:00')).toBe(840);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes(null)).toBeNull();
  });

  it('detects identical date and time overlap', () => {
    const a = { id: '1', title: 'OS Exam', date: '2026-11-01', time: '14:00' };
    const b = { id: '2', title: 'Robotics Meet', date: '2026-11-01', time: '14:00' };

    expect(isEventConflict(a, b)).toBe(true);
  });

  it('detects staggered overlapping times within 60 minutes', () => {
    // a starts at 14:00 (ends 15:00), b starts at 14:30
    const a = { id: '1', title: 'OS Exam', date: '2026-11-01', time: '14:00' };
    const b = { id: '2', title: 'Robotics Meet', date: '2026-11-01', time: '14:30' };

    expect(isEventConflict(a, b)).toBe(true);
  });

  it('does NOT report conflict for non-overlapping times on the same date', () => {
    // a starts at 10:00 (ends 11:00), b starts at 14:00
    const a = { id: '1', title: 'Morning Lecture', date: '2026-11-01', time: '10:00' };
    const b = { id: '2', title: 'Afternoon Lab', date: '2026-11-01', time: '14:00' };

    expect(isEventConflict(a, b)).toBe(false);
  });

  it('does NOT report conflict for different dates even with identical times', () => {
    const a = { id: '1', title: 'Event A', date: '2026-11-01', time: '14:00' };
    const b = { id: '2', title: 'Event B', date: '2026-11-02', time: '14:00' };

    expect(isEventConflict(a, b)).toBe(false);
  });

  it('flags two exams on the same date even without specific times', () => {
    const a = { id: '1', title: 'Physics Final', category: 'Exam', date: '2026-11-01', time: null };
    const b = { id: '2', title: 'Maths Final', category: 'Exam', date: '2026-11-01', time: null };

    expect(isEventConflict(a, b)).toBe(true);
  });

  it('builds a bidirectional conflict map for multiple events', () => {
    const events = [
      { id: '1', title: 'OS Exam', date: '2026-11-01', time: '14:00' },
      { id: '2', title: 'Robotics Meet', date: '2026-11-01', time: '14:30' },
      { id: '3', title: 'Football Practice', date: '2026-11-01', time: '18:00' }
    ];

    const conflicts = detectConflicts(events);
    expect(conflicts['1']).toBeDefined();
    expect(conflicts['2']).toBeDefined();
    expect(conflicts['3']).toBeUndefined(); // No conflict for football at 18:00

    expect(conflicts['1'][0].id).toBe('2');
    expect(conflicts['2'][0].id).toBe('1');
  });

  it('formats human-readable conflict warning', () => {
    const conflictMap = {
      '1': [{ id: '2', title: 'Robotics Club', time: '14:30', date: '2026-11-01' }]
    };

    const warning = getConflictWarning('1', conflictMap);
    expect(warning).toBe('Schedule conflict with "Robotics Club" at 14:30');
  });
});

