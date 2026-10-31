import { describe, it, expect } from 'vitest';
import {
  escapeIcsText,
  foldIcsLine,
  formatIcsTimestamp,
  generateVEvent,
  generateIcsContent,
  getIcsFilename
} from '../utils/ics.js';

describe('iCalendar (.ics) Generation', () => {
  it('escapes special characters correctly per RFC 5545', () => {
    expect(escapeIcsText('Hello, World; test\\backslash\nnew line')).toBe(
      'Hello\\, World\\; test\\\\backslash\\nnew line'
    );
  });

  it('folds lines exceeding 75 characters', () => {
    const longLine = 'SUMMARY:' + 'A'.repeat(80);
    const folded = foldIcsLine(longLine);
    expect(folded).toContain('\r\n ');
    const lines = folded.split('\r\n');
    expect(lines[0].length).toBeLessThanOrEqual(75);
  });

  it('formats UTC timestamps according to iCalendar format', () => {
    const d = new Date(Date.UTC(2026, 9, 31, 14, 30, 0));
    expect(formatIcsTimestamp(d)).toBe('20261031T143000Z');
  });

  it('generates a valid VEVENT for a timed event', () => {
    const event = {
      id: 'test-123',
      title: 'OS Midterm Exam',
      date: '2026-11-01',
      time: '14:00',
      venue: 'Auditorium Hall B',
      category: 'Exam'
    };

    const vevent = generateVEvent(event, '20261031T120000Z');
    expect(vevent).toContain('BEGIN:VEVENT');
    expect(vevent).toContain('UID:test-123@camliv.app');
    expect(vevent).toContain('DTSTART:20261101T140000');
    expect(vevent).toContain('DTEND:20261101T150000');
    expect(vevent).toContain('SUMMARY:OS Midterm Exam');
    expect(vevent).toContain('LOCATION:Auditorium Hall B');
    expect(vevent).toContain('END:VEVENT');
  });

  it('generates all-day event for events without specific time', () => {
    const event = {
      id: 'all-day-1',
      title: 'Annual Sports Day',
      date: '2026-11-05',
      time: null
    };

    const vevent = generateVEvent(event, '20261031T120000Z');
    expect(vevent).toContain('DTSTART;VALUE=DATE:20261105');
    expect(vevent).toContain('DTEND;VALUE=DATE:20261106');
  });

  it('generates a complete VCALENDAR file wrapper', () => {
    const event = {
      id: 'ev-1',
      title: 'Campus Hackathon',
      date: '2026-11-10',
      time: '09:00'
    };

    const ics = generateIcsContent(event);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('PRODID:-//CamLiv//Campus Event Organizer//EN');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:Campus Hackathon');
  });

  it('generates clean sanitized filenames', () => {
    expect(getIcsFilename('OS Midterm: Exam! (2026)')).toBe('os-midterm-exam-2026.ics');
    expect(getIcsFilename('')).toBe('campus-event.ics');
  });
});

