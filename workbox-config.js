// Generates dist/sw.js after `expo export -p web` (see the build:web script)
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,json,png,ico,ttf,woff,woff2}'],
  // Bracketed files (list/[id].html) can't be served by Cloudflare; their copies live in _shells/
  globIgnores: ['sw.js', 'workbox-*.js', '_headers', '_redirects', '**/*\\[*'],
  swDest: 'dist/sw.js',
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  // Static routes are precached as .html; unknown URLs fall back to the app shell
  navigateFallback: '/index.html',
  // Dynamic routes (/list/<id>) get their own pre-rendered page from the network (see
  // scripts/web-shells.js), kept in cache so lists opened before still work offline
  navigateFallbackDenylist: [/^\/list\//],
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) => request.mode === 'navigate' && url.pathname.startsWith('/list/'),
      handler: 'NetworkFirst',
      options: { cacheName: 'list-pages', expiration: { maxEntries: 100 } },
    },
  ],
  // New deploys take over on the next load instead of waiting for every tab to close
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
};
