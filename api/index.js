import app from '../server/index.js';

export default function handler(req, res) {
  // Restore original URL when rewritten by Vercel serverless functions
  const original = req.headers['x-vercel-matched-path'] ||
                   req.headers['x-matched-path'] ||
                   req.headers['x-forwarded-uri'] ||
                   req.headers['x-invoke-path'];

  if (original && (req.url === '/api/index.js' || req.url.startsWith('/api/index.js') || req.url === '/api')) {
    req.url = original;
  }

  return app(req, res);
}
