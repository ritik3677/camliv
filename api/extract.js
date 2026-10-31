/**
 * Serverless function: /api/extract
 * Extracts structured campus events from messy text forwards using Google Gemini API.
 */

// Simple in-memory rate limiter per IP: max 25 requests per minute
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 25;

  let record = rateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    rateLimitMap.set(ip, record);
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up stale rate limit entries periodically without keeping process alive
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now - record.startTime > 60000) {
        rateLimitMap.delete(ip);
      }
    }
  }, 120000);
  if (timer.unref) timer.unref();
}

const VALID_CATEGORIES = new Set([
  'Academic',
  'Exam',
  'Event',
  'Deadline',
  'Sports',
  'Club',
  'Placement',
  'Other'
]);

/**
 * Validate and sanitize an extracted event object
 */
function sanitizeEvent(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 150) : '';
  if (!title) return null; // title is mandatory

  // Validate date (YYYY-MM-DD or null)
  let date = null;
  if (typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())) {
    date = raw.date.trim();
  }

  // Validate time (HH:MM or null)
  let time = null;
  if (typeof raw.time === 'string') {
    const trimmedTime = raw.time.trim();
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmedTime)) {
      time = trimmedTime;
    }
  }

  // Validate venue
  const venue = typeof raw.venue === 'string' && raw.venue.trim().length > 0
    ? raw.venue.trim().slice(0, 100)
    : null;

  // Validate category
  let category = 'Other';
  if (typeof raw.category === 'string' && VALID_CATEGORIES.has(raw.category.trim())) {
    category = raw.category.trim();
  }

  // Validate confidence (0.0 to 1.0)
  let confidence = 0.85;
  if (typeof raw.confidence === 'number' && !isNaN(raw.confidence)) {
    confidence = Math.max(0, Math.min(1, Math.round(raw.confidence * 100) / 100));
  }

  // Validate uncertain_fields
  const uncertainFields = Array.isArray(raw.uncertain_fields)
    ? raw.uncertain_fields.filter((f) => typeof f === 'string').slice(0, 5)
    : [];

  return {
    id: `ev-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    date,
    time,
    venue,
    category,
    confidence,
    uncertain_fields: uncertainFields,
    createdAt: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  // CORS & Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Basic IP rate limiting
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
  }

  const { text, today } = body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Input text is required.' });
  }

  // Limit input length for safety (max 5,000 characters)
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Input text exceeds maximum allowed length of 5,000 characters.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured. Please set it in your deployment settings or .env file.'
    });
  }

  const referenceDate = typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today)
    ? today
    : new Date().toISOString().split('T')[0];

  const now = new Date(referenceDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[now.getDay()];

  const systemPrompt = `You are an expert campus assistant that extracts structured university events and deadlines from messy text (WhatsApp forwards, emails, notices, poster captions).

Today's Date: ${referenceDate} (${dayOfWeek}).
Use this reference date to accurately resolve relative dates like "tomorrow", "this Friday", "next Monday", "in 3 days", etc.

Instructions:
1. Extract ALL distinct campus events, exams, assignment deadlines, sports trials, club meetings, placement talks, or workshops mentioned in the text.
2. If the text is merely conversational chatter, greetings, spam, or contains NO actionable campus events or deadlines, return an empty JSON array: [].
3. Output a valid JSON array of objects. Each object MUST strictly have these fields:
   - "title": Clear, concise event title (e.g., "Operating Systems Midterm Exam", "DBMS Mini Project Submission").
   - "date": "YYYY-MM-DD" resolved relative to today (${referenceDate}), or null if completely unspecified.
   - "time": "HH:MM" (24-hour format, e.g., "14:00" for 2 PM, "09:30" for 9:30 AM), or null if unspecified.
   - "venue": Classroom, lab, hall, platform, or null (e.g., "Hall B", "Google Classroom").
   - "category": One of "Academic", "Exam", "Event", "Deadline", "Sports", "Club", "Placement", "Other".
   - "confidence": Float between 0.0 and 1.0 indicating your certainty.
   - "uncertain_fields": Array of field names that were ambiguous or guessed (e.g. ["time"], ["date"]), or [] if confident.
4. NEVER hallucinate or invent dates, times, or details not present or implied in the text.
5. If the time says e.g. "sharp 2 PM", time is "14:00". If "midnight", time is "23:59".
6. Respond with ONLY raw JSON (an array of objects).`;

  try {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let responseData = null;
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nINPUT TEXT TO PARSE:\n"""\n${text}\n"""` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          lastError = new Error(`Gemini API (${model}) failed with status ${geminiRes.status}: ${errText}`);
          continue; // try next model
        }

        responseData = await geminiRes.json();
        if (responseData) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!responseData) {
      throw lastError || new Error('Failed to obtain response from Gemini models.');
    }

    const rawCandidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawCandidateText) {
      return res.status(200).json({ events: [], count: 0 });
    }

    // Clean JSON markdown wrappers if present
    let cleanedJson = rawCandidateText.trim();
    if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed = [];
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      // Attempt to extract JSON array substring
      const start = cleanedJson.indexOf('[');
      const end = cleanedJson.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        parsed = JSON.parse(cleanedJson.slice(start, end + 1));
      } else {
        throw new Error('AI output was not valid JSON.');
      }
    }

    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    const sanitizedEvents = parsed
      .map((item, idx) => sanitizeEvent(item, idx))
      .filter(Boolean);

    return res.status(200).json({
      events: sanitizedEvents,
      count: sanitizedEvents.length
    });
  } catch (error) {
    console.error('Error in /api/extract:', error);
    return res.status(500).json({
      error: 'Failed to extract events. ' + (error.message || 'Please check your connection or try again.')
    });
  }
}
