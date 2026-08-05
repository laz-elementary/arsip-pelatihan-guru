import { createServerApp } from '../server.js';

const appPromise = createServerApp();

export default async function handler(req: any, res: any) {
  const app = await appPromise;

  // vercel.json forwards /api/* to this function and keeps the original path
  // in the `path` query parameter. Restore it for Express route matching.
  const forwardedPath = req.query?.path;
  if (forwardedPath) {
    const pathValue = Array.isArray(forwardedPath) ? forwardedPath.join('/') : String(forwardedPath);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === 'path' || value == null) continue;
      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, String(item)));
      } else {
        query.append(key, String(value));
      }
    }
    req.url = `/api/${pathValue}${query.size ? `?${query.toString()}` : ''}`;
  }

  return app(req, res);
}
