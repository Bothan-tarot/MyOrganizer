// Cloudflare Worker: serves the exported web app (dist/) and the /api/* routes.
// Static files are served by the assets layer; only /api/* reaches this code (see wrangler.jsonc).

export interface Env {
  ASSETS: Fetcher;
  TMDB_TOKEN: string;
}

const CORS = {
  // The native app and the local dev server call the API from another origin
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200, extra: HeadersInit = {}) =>
  Response.json(body, { status, headers: { ...CORS, ...extra } });

type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string | null;
  popularity: number;
};

// GET /api/movies?query=... → TMDB search, token kept server-side
async function searchMovies(request: Request, env: Env, ctx: ExecutionContext) {
  const query = new URL(request.url).searchParams.get('query')?.trim().slice(0, 100);
  if (!query) return json({ error: 'missing query' }, 400);

  // Same query from anyone → served from Cloudflare's edge cache for a day
  const cacheKey = new Request(`https://cache.internal/movies?q=${encodeURIComponent(query.toLowerCase())}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ query, language: 'fr-FR', include_adult: 'false' });
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`, {
    headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) return json({ error: `TMDB ${res.status}` }, 502);

  const data = (await res.json()) as { results: TmdbMovie[] };
  // Only what the app displays
  const results = data.results.map(
    ({ id, title, original_title, release_date, poster_path, popularity }) => ({
      id,
      title,
      original_title,
      release_date,
      poster_path,
      popularity,
    }),
  );

  const response = json({ results }, 200, { 'Cache-Control': 'public, max-age=86400' });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (pathname === '/api/movies' && request.method === 'GET') {
      return searchMovies(request, env, ctx);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
