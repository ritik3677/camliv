import { describe, it, expect, vi } from 'vitest';
import extractHandler from '../../api/extract.js';
import digestHandler from '../../api/digest.js';

function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'POST',
    headers: options.headers || { 'x-forwarded-for': '127.0.0.1' },
    body: options.body || {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  return { req, res };
}

describe('/api/extract route handling', () => {
  it('rejects non-POST HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await extractHandler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.data.error).toContain('Method not allowed');
  });

  it('rejects empty input text with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { text: '' }
    });
    await extractHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.data.error).toContain('Input text is required');
  });

  it('rejects text exceeding 5000 characters with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { text: 'a'.repeat(5001) }
    });
    await extractHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.data.error).toContain('maximum allowed length');
  });

  it('returns 500 if GEMINI_API_KEY is not configured', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const { req, res } = createMockReqRes({
        method: 'POST',
        body: { text: 'Exam tomorrow at 2 PM' }
      });
      await extractHandler(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.data.error).toContain('GEMINI_API_KEY');
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});

describe('/api/digest route handling', () => {
  it('rejects non-POST methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await digestHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('handles empty events array gracefully without calling AI', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { events: [], today: '2026-10-31' }
    });
    await digestHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.data.digest).toContain('no upcoming events');
  });

  it('filters out past events when all events are expired', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        events: [{ title: 'Old Event', date: '2020-01-01' }],
        today: '2026-10-31'
      }
    });
    await digestHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.data.digest).toContain('expired');
  });
});
