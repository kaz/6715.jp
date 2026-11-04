import type { Plugin } from 'vite-plus';

/**
 * Serve /posts/1/ and /tags/CTF/ in dev like the static host does.
 *
 * Void's dev router only matches /posts/1 and redirects /posts/1/ there, while
 * the build moves posts/1.html to posts/1/index.html (scripts/finalize.ts), so
 * production serves the trailing-slash URL as is. Rewrite the request
 * internally so the address bar keeps the production URL.
 */
export function trailingSlashDev(): Plugin {
  return {
    name: 'blog:trailing-slash-dev',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && (req.method === 'GET' || req.method === 'HEAD')) {
          const query = req.url.search(/[?#]/);
          const pathname = query === -1 ? req.url : req.url.slice(0, query);
          if (/^\/(?:posts|tags)\/[^/]+\/$/.test(pathname)) {
            req.url = pathname.slice(0, -1) + (query === -1 ? '' : req.url.slice(query));
            // @cloudflare/vite-plugin restores req.url from originalUrl.
            (req as typeof req & { originalUrl?: string }).originalUrl = req.url;
          }
        }
        next();
      });
    },
  };
}
