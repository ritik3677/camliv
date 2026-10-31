import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  stringSimilarity,
  findDuplicateEvent,
  partitionCandidatesByDuplicate
} from '../utils/duplicate.js';

describe('Duplicate Detection Logic', () => {
  it('normalizes titles correctly', () => {
    expect(normalizeTitle('🔥 Midterm Exam: Physics 101! ')).toBe('midterm exam physics 101');
    expect(normalizeTitle('DBMS  Mini-Project   Submission')).toBe('dbms mini project submission');
  });

  it('calculates string similarity accurately', () => {
    expect(stringSimilarity('OS Midterm Exam', 'OS Midterm Exam')).toBe(1.0);
    expect(stringSimilarity('Operating Systems Exam', 'Operating Systems Exam 2026')).toBeGreaterThan(0.7);
    expect(stringSimilarity('Football Match', 'Chemistry Lab')).toBeLessThan(0.3);
  });

  it('detects duplicate events with exact title and date', () => {
    const existing = [
      { id: '1', title: 'DBMS Mini Project Submission', date: '2026-11-06', time: '17:00' }
    ];
    const candidate = {
      title: 'DBMS Mini Project Submission',
      date: '2026-11-06',
      time: '17:00'
    };

    const duplicate = findDuplicateEvent(candidate, existing);
    expect(duplicate).not.toBeNull();
    expect(duplicate.id).toBe('1');
  });

  it('detects duplicate with minor punctuation and formatting differences', () => {
    const existing = [
      { id: '1', title: 'Robotics & AI Club Hackathon', date: '2026-11-02', time: '14:30' }
    ];
    const candidate = {
      title: 'Robotics and AI Club - Hackathon!!',
      date: '2026-11-02',
      time: '14:30'
    };

    const duplicate = findDuplicateEvent(candidate, existing);
    expect(duplicate).not.toBeNull();
    expect(duplicate.id).toBe('1');
  });

  it('does NOT flag distinct events on the same date as duplicates', () => {
    const existing = [
      { id: '1', title: 'Calculus Lecture', date: '2026-11-02', time: '10:00' }
    ];
    const candidate = {
      title: 'Physics Lab Session',
      date: '2026-11-02',
      time: '14:00'
    };

    const duplicate = findDuplicateEvent(candidate, existing);
    expect(duplicate).toBeNull();
  });

  it('partitions candidate batch into unique and duplicate sets', () => {
    const existing = [
      { id: '1', title: 'Operating Systems Midterm', date: '2026-11-01', time: '14:00' }
    ];

    const candidates = [
      { title: 'Operating Systems Midterm', date: '2026-11-01', time: '14:00' }, // dup
      { title: 'Campus Placement Drive', date: '2026-11-05', time: '09:00' }     // new
    ];

    const { unique, duplicates } = partitionCandidatesByDuplicate(candidates, existing);
    expect(unique.length).toBe(1);
    expect(unique[0].title).toBe('Campus Placement Drive');
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].candidate.title).toBe('Operating Systems Midterm');
  });
});
