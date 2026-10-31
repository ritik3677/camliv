/**
 * Serverless function: /api/digest
 * Generates a concise (under 150 words) weekly briefing from active events using Google Gemini API.
 */

// Simple in-memory rate limiter per IP: max 20 requests per minute
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

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

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
  }

  const { events, today } = body || {};

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(200).json({
      digest: 'You have no upcoming events or deadlines scheduled for this week! Enjoy your downtime or paste new notices to get organized.',
      wordCount: 21,
      activeEventsCount: 0
    });
  }

  const referenceDate = typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today)
    ? today
    : new Date().toISOString().split('T')[0];

  // Filter out expired items: only include events on or after today
  const activeEvents = events.filter((ev) => {
    if (!ev || !ev.date) return true; // keep unscheduled or date-pending
    return ev.date >= referenceDate;
  });

  if (activeEvents.length === 0) {
    return res.status(200).json({
      digest: 'All your past events have expired, and there are no upcoming deadlines this week. Add new campus notices to plan ahead!',
      wordCount: 22,
      activeEventsCount: 0
    });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured. Please set it in your deployment settings or .env file.'
    });
  }

  // Format events compactly for prompt
  const eventSummaries = activeEvents.slice(0, 20).map((ev) => {
    const timeStr = ev.time ? ` at ${ev.time}` : '';
    const venueStr = ev.venue ? ` (${ev.venue})` : '';
    return `- [${ev.category || 'Event'}] "${ev.title}": ${ev.date || 'TBD'}${timeStr}${venueStr}`;
  }).join('\n');

  const systemPrompt = `You are CamLiv, an intelligent executive student assistant.
Today's Date: ${referenceDate}.

Your task is to produce a high-impact, crystal-clear weekly briefing for a busy university student based ONLY on their upcoming active events below.

STRICT CONSTRAINTS:
1. Total length MUST BE UNDER 150 WORDS.
2. Structure in 4 brief sections:
   - Overview: 1 snappy sentence on what this week looks like.
   - Do First: Top 1-2 urgent priorities/deadlines/exams.
   - Day-by-day: Bulleted days with event times.
   - Heads-up: Call out any overlapping events, tight turnarounds, or things needing prep.
3. Be calm, motivating, and direct. No filler or fluff. Plain text with clean markdown bullets (no HTML tags).`;

  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3-flash',
    'gemini-2.5-pro'
  ];

  try {
    let responseData = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nACTIVE UPCOMING EVENTS:\n${eventSummaries}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 300
            }
          })
        });

        if (geminiRes.ok) {
          responseData = await geminiRes.json();
          if (responseData) break;
        } else {
          const errText = await geminiRes.text();
          lastError = new Error(`Gemini API (${model}) failed with status ${geminiRes.status}: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Dynamic discovery fallback if standard names all failed
    if (!responseData) {
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          headers: { 'x-goog-api-key': apiKey }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const usable = listData.models?.filter(m =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent')
          );
          if (usable && usable.length > 0) {
            // Find a flash model or take the first usable
            const chosen = usable.find(m => m.name.includes('flash')) || usable[0];
            const dynamicModel = chosen.name.replace(/^models\//, '');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${dynamicModel}:generateContent?key=${apiKey}`;
            const dynRes = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nACTIVE UPCOMING EVENTS:\n${eventSummaries}` }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
              })
            });
            if (dynRes.ok) {
              responseData = await dynRes.json();
            }
          }
        }
      } catch (listErr) {
        console.error('ListModels fallback failed:', listErr);
      }
    }

    if (!responseData) {
      throw lastError || new Error('Failed to obtain response from Gemini models.');
    }

    const digestText = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const wordCount = digestText.split(/\s+/).filter(Boolean).length;

    return res.status(200).json({
      digest: digestText,
      wordCount,
      activeEventsCount: activeEvents.length
    });
  } catch (error) {
    console.error('Error in /api/digest:', error);
    return res.status(500).json({
      error: 'Failed to generate weekly digest. ' + (error.message || 'Please try again.')
    });
  }
}
