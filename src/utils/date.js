/**
 * Date and time formatting and resolution utilities for Campus Pulse.
 */

/**
 * Format a YYYY-MM-DD date string into human-friendly format
 * e.g., "Saturday, Oct 31, 2026" or "Tomorrow, Nov 1"
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function formatFriendlyDate(dateStr, now = new Date()) {
  if (!dateStr || typeof dateStr !== 'string') return 'Date to be announced';

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const eventDate = new Date(y, m, d);
  if (isNaN(eventDate.getTime())) return dateStr;

  // Compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(y, m, d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dayOfWeek = dayNames[eventDate.getDay()];
  const monthName = monthNames[m];

  if (diffDays === 0) return `Today (${dayOfWeek}, ${monthName} ${d})`;
  if (diffDays === 1) return `Tomorrow (${dayOfWeek}, ${monthName} ${d})`;
  if (diffDays === -1) return `Yesterday (${dayOfWeek}, ${monthName} ${d})`;

  if (diffDays > 1 && diffDays < 7) {
    return `In ${diffDays} days (${dayOfWeek}, ${monthName} ${d})`;
  }

  return `${dayOfWeek}, ${monthName} ${d}, ${y}`;
}

/**
 * Format 24h HH:MM string to 12h AM/PM string
 * @param {string} timeStr - '14:30'
 * @returns {string} - '2:30 PM'
 */
export function formatFriendlyTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 'Time TBD';

  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;

  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');

  if (isNaN(h)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  return `${h}:${m} ${ampm}`;
}

/**
 * Resolve relative day offsets (useful for prompt instructions and unit tests)
 * @param {string} relativeTerm - 'today' | 'tomorrow' | 'day_after_tomorrow' | 'this_friday'
 * @param {Date} [baseDate=new Date()]
 * @returns {string} 'YYYY-MM-DD'
 */
export function resolveRelativeDate(relativeTerm, baseDate = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const term = relativeTerm.toLowerCase().trim();

  if (term === 'today') {
    // offset 0
  } else if (term === 'tomorrow') {
    d.setDate(d.getDate() + 1);
  } else if (term === 'day_after_tomorrow' || term === 'day after tomorrow') {
    d.setDate(d.getDate() + 2);
  } else if (term.startsWith('in_') || term.startsWith('in ')) {
    const match = term.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 0;
    d.setDate(d.getDate() + num);
  } else if (term.includes('friday')) {
    // Upcoming Friday
    const day = d.getDay(); // 0 is Sun, 5 is Fri
    let diff = (5 - day + 7) % 7;
    if (diff === 0 && term.includes('next')) diff = 7;
    d.setDate(d.getDate() + diff);
  } else if (term.includes('monday')) {
    const day = d.getDay(); // 1 is Mon
    let diff = (1 - day + 7) % 7;
    if (diff === 0 && term.includes('next')) diff = 7;
    d.setDate(d.getDate() + diff);
  }

  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const dayStr = pad(d.getDate());
  return `${y}-${m}-${dayStr}`;
}

/**
 * Generate calendar grid cells for a given month and year.
 * Returns an array of day objects: { dateStr, dayNum, isCurrentMonth, isToday }
 * @param {number} year
 * @param {number} month - 0-indexed (0 = Jan, 11 = Dec)
 * @param {Date} [now=new Date()]
 * @returns {Array<{ dateStr: string, dayNum: number, isCurrentMonth: boolean, isToday: boolean }>}
 */
export function getMonthCalendarDays(year, month, now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const days = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(dayNum)}`;
    days.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(i)}`;
    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
      isToday: dateStr === todayStr
    });
  }

  // Next month leading days to complete the 35 or 42 grid (6 rows of 7 = 42)
  const totalCells = Math.ceil(days.length / 7) * 7;
  let nextDay = 1;
  while (days.length < totalCells) {
    const nextDate = new Date(year, month + 1, nextDay);
    const dateStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDay)}`;
    days.push({
      dateStr,
      dayNum: nextDay,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
    nextDay++;
  }

  return days;
}

