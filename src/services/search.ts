import { Platform } from 'react-native';
import { ListKind } from '@/store/types';

export type Suggestion = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
};

// Search engines treat these as operators; strip them from user input
const sanitize = (query: string) => query.replace(/["*:()\\]/g, ' ').trim();

// "le seigneur des" -> "le seigneur des*" so the last word matches as a prefix
const asPrefixQuery = (query: string) => `${sanitize(query)}*`;

// The TMDB token lives in the Cloudflare Worker (worker/index.ts), never in the app.
// EXPO_PUBLIC_API_URL (.env.local) points to the deployed Worker; the web build hosted by
// that same Worker can leave it empty and call /api on its own origin.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? '' : undefined);

async function searchMoviesTmdb(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const params = new URLSearchParams({ query: query.trim() });
  const res = await fetch(`${API_URL}/api/movies?${params}`, { signal });
  if (!res.ok) throw new Error(`Movies API ${res.status}`);
  const json = await res.json();

  type Movie = {
    id: number;
    title: string;
    original_title: string;
    release_date?: string;
    poster_path?: string | null;
    popularity: number;
  };
  // TMDB ranks partial matches loosely; popular films first is more useful while typing
  return (json.results as Movie[])
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10)
    .map((m) => ({
      id: String(m.id),
      title: m.title,
      subtitle:
        [m.release_date?.slice(0, 4), m.original_title !== m.title ? m.original_title : null]
          .filter(Boolean)
          .join(' · ') || undefined,
      imageUrl: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : undefined,
    }));
}

// Fallback without API key: Wikidata (no posters)
async function searchMoviesWikidata(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  // Full-text search restricted to items that are films (P31 = Q11424)
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${asPrefixQuery(query)} haswbstatement:P31=Q11424`,
    gsrlimit: '10',
    prop: 'entityterms',
    wbetlanguage: 'fr',
    wbetterms: 'label|description',
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`, {
    signal,
    headers: { 'Api-User-Agent': 'MyOrganizer/1.0' },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const json = await res.json();

  type Page = {
    title: string;
    index: number;
    entityterms?: { label?: string[]; description?: string[] };
  };
  const pages: Page[] = Object.values(json.query?.pages ?? {});
  return pages
    .sort((a, b) => a.index - b.index)
    .filter((p) => p.entityterms?.label?.[0])
    .map((p) => ({
      id: p.title,
      title: p.entityterms!.label![0],
      subtitle: p.entityterms?.description?.[0],
    }));
}

async function searchBooks(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    q: asPrefixQuery(query),
    limit: '10',
    fields: 'key,title,author_name,first_publish_year,cover_i',
  });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const json = await res.json();

  type Doc = {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
  };
  return (json.docs as Doc[]).map((d) => ({
    id: d.key,
    title: d.title,
    subtitle:
      [d.author_name?.slice(0, 2).join(', '), d.first_publish_year].filter(Boolean).join(' · ') ||
      undefined,
    imageUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg` : undefined,
  }));
}

export function searchFor(kind: ListKind) {
  if (kind === 'movies') return API_URL !== undefined ? searchMoviesTmdb : searchMoviesWikidata;
  if (kind === 'books') return searchBooks;
  return null;
}
