import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import extractHandler from './api/extract.js';
import digestHandler from './api/digest.js';

/**
 * Vite plugin that mounts the Vercel serverless API handlers during local development (npm run dev)
 */
function vercelDevApiPlugin() {
  return {
    name: 'vercel-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/extract' || url === '/api/digest') {
          // Collect request body
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const rawBody = Buffer.concat(chunks).toString();
          let body = {};
          if (rawBody) {
            try {
              body = JSON.parse(rawBody);
            } catch {
              body = rawBody;
            }
          }
          req.body = body;

          // Serverless response helper methods
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
          };

          try {
            if (url === '/api/extract') {
              return await extractHandler(req, res);
            } else if (url === '/api/digest') {
              return await digestHandler(req, res);
            }
          } catch (err) {
            console.error('API Error in dev server:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load env variables (like GEMINI_API_KEY) into process.env for local serverless execution
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, val] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  return {
    plugins: [react(), vercelDevApiPlugin()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js'
    }
  };
});

