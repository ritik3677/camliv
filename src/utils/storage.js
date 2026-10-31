/**
 * Storage and sample data utilities for Campus Pulse.
 */

const STORAGE_KEY = 'campus_pulse_events_v1';
const THEME_KEY = 'campus_pulse_theme';

/**
 * Realistic messy WhatsApp forward containing 3-4 campus events with dates, times, venues, and reminders.
 */
export const SAMPLE_MESSY_TEXT = `🔥 CS & ENGG DEPT ANNOUNCEMENTS (PLEASE READ CAREFULLY!) 🔥

Hey guys, multiple updates from HOD sir & faculty coordinators:

1. DBMS Mini Project Submission deadline is this Friday by 5:00 PM on Google Classroom portal. No extensions! Dr. Sharma will conduct viva next Monday at 10 AM in Lab 302.

2. Midterm Exam for Operating Systems has been scheduled for tomorrow afternoon at 2:00 PM sharp in Main Auditorium Hall B. Please bring your hall tickets and blue ballpoint pens.

3. Robotics & AI Club Hackathon Orientation: Tomorrow at 2:30 PM in Seminar Hall 1. All teams must register their team leader by midnight. Refreshments will be served! 🍕

4. Annual Inter-College Sports Fest trials for Badminton & Football will be held this Saturday morning starting 8:00 AM at the University Sports Complex. Wear proper sports attire.

Forwarded as received. Don't spam the group with "ok sir".`;

/**
 * Seed events for first-time onboarding (if user desires quick exploration)
 */
export function getInitialDemoEvents() {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();

  // Today
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Tomorrow
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

  // In 3 days
  const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const futureStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;

  // Yesterday (past event for demo)
  const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const pastStr = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;

  return [
    {
      id: 'demo-1',
      title: 'Operating Systems Midterm Exam',
      date: todayStr,
      time: '14:00',
      venue: 'Main Auditorium Hall B',
      category: 'Exam',
      confidence: 0.95,
      uncertain_fields: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Robotics Club Hackathon Orientation',
      date: todayStr,
      time: '14:30', // Conflicts with Exam!
      venue: 'Seminar Hall 1',
      category: 'Club',
      confidence: 0.9,
      uncertain_fields: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: 'DBMS Mini Project Code & Report Submission',
      date: tomorrowStr,
      time: '17:00',
      venue: 'Google Classroom Portal',
      category: 'Deadline',
      confidence: 0.98,
      uncertain_fields: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-4',
      title: 'Inter-College Sports Fest Trials',
      date: futureStr,
      time: '08:00',
      venue: 'University Sports Complex',
      category: 'Sports',
      confidence: 0.85,
      uncertain_fields: ['time'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-5',
      title: 'Campus Placement Prep Workshop',
      date: pastStr,
      time: '11:00',
      venue: 'Tech Tower Room 405',
      category: 'Placement',
      confidence: 0.92,
      uncertain_fields: [],
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Load events from localStorage safely
 * @returns {Array<Object>}
 */
export function loadSavedEvents() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time user: provide sample events so they see the power immediately
      const initial = getInitialDemoEvents();
      saveEvents(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse saved events from localStorage:', err);
    return [];
  }
}

/**
 * Persist events to localStorage
 * @param {Array<Object>} events
 */
export function saveEvents(events) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

/**
 * Load saved theme preference
 * @returns {'dark'|'light'}
 */
export function loadSavedTheme() {
  if (typeof window === 'undefined' || !window.localStorage) return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
}

/**
 * Save theme preference
 * @param {'dark'|'light'} theme
 */
export function saveTheme(theme) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}
