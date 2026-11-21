interface Env {
  UPSTREAM: string;
  ALLOWED_ORIGINS: string;
  ALDIWAN_API_KEY?: string;
}

type CacheStatus = 'HIT' | 'MISS';
type ErrorBody = { error: { code: string; message: string } };

const CACHE_SECONDS = 86400;
const MAX_QUERY_LENGTH = 2048;
const FORWARDED_HEADERS = [
  'content-type', 'retry-after', 'x-request-id',
  'x-monthlyquota-limit', 'x-monthlyquota-remaining', 'x-monthlyquota-reset',
  'x-fulltextquota-daily-limit', 'x-fulltextquota-daily-remaining', 'x-fulltextquota-daily-reset',
  'x-fulltextquota-monthly-limit', 'x-fulltextquota-monthly-remaining', 'x-fulltextquota-monthly-reset',
] as const;
const EXPOSED_HEADERS =
  'X-Request-Id, Retry-After, X-MonthlyQuota-Limit, X-MonthlyQuota-Remaining, X-MonthlyQuota-Reset, X-FullTextQuota-Daily-Limit, X-FullTextQuota-Daily-Remaining, X-FullTextQuota-Daily-Reset, X-FullTextQuota-Monthly-Limit, X-FullTextQuota-Monthly-Remaining, X-FullTextQuota-Monthly-Reset';

function copiedHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

function respond(
  body: BodyInit | null,
  status: number,
  origin: string | null,
  options: { error?: ErrorBody; cache?: CacheStatus; upstream?: Response } = {},
): Response {
  const headers = options.upstream ? copiedHeaders(options.upstream) : new Headers();
  if (options.error) headers.set('Content-Type', 'application/json; charset=utf-8');
  if (origin !== null) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type');
    headers.set('Access-Control-Max-Age', String(CACHE_SECONDS));
    headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS);
  }
  if (options.cache) headers.set('X-Proxy-Cache', options.cache);
  return new Response(options.error ? JSON.stringify(options.error) : body, { status, headers });
}

function fail(status: number, code: string, message: string, origin: string | null, cache?: CacheStatus): Response {
  return respond(null, status, origin, { error: { error: { code, message } }, cache });
}

function resolveOrigin(request: Request, env: Env): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get('Origin');
  if (origin === null) return { allowed: true, origin: null };
  const allowed = env.ALLOWED_ORIGINS.split(',').some((candidate) => candidate.trim() === origin);
  return { allowed, origin: allowed ? origin : null };
}

function unsafePath(path: string): boolean {
  try {
    const decoded = decodeURIComponent(path);
    return path.includes('..') || decoded.includes('..') || /[a-z][a-z0-9+.-]*:/i.test(decoded);
  } catch {
    return true;
  }
}

function cacheKeyFor(url: URL): Request {
  const normalized = new URL(url.toString());
  normalized.searchParams.sort();
  return new Request(normalized.toString(), { method: 'GET' });
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'TimeoutError'
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = resolveOrigin(request, env);

    if (!origin.allowed) {
      return fail(403, 'origin_not_allowed', 'This origin is not allowed.', null);
    }
    if (request.method !== 'GET' && request.method !== 'OPTIONS') {
      return fail(405, 'method_not_allowed', 'Only GET and OPTIONS are allowed.', origin.origin);
    }
    if (request.method === 'OPTIONS') return respond(null, 204, origin.origin);
    if (url.search.slice(1).length > MAX_QUERY_LENGTH) {
      return fail(414, 'query_too_long', 'Query strings are limited to 2048 characters.', origin.origin);
    }
    if (!url.pathname.startsWith('/api/')) {
      return fail(404, 'not_found', 'The path must start with /api/.', origin.origin);
    }

    const path = url.pathname.slice('/api/'.length);
    if (path === '') return fail(404, 'not_found', 'An API path is required.', origin.origin);
    if (unsafePath(path)) {
      return fail(400, 'invalid_path', 'The requested path is not allowed.', origin.origin);
    }

    const apiKey = env.ALDIWAN_API_KEY;
    if (!apiKey) {
      return fail(503, 'proxy_not_configured', 'ALDIWAN_API_KEY is not set.', origin.origin);
    }

    let upstreamUrl: URL;
    try {
      const base = env.UPSTREAM.replace(/\/+$/, '');
      upstreamUrl = new URL(`${base}/${path}${url.search}`);
    } catch {
      return fail(500, 'proxy_misconfigured', 'UPSTREAM is not a valid URL.', origin.origin);
    }

    const bypassCache = url.searchParams.get('nocache') === '1';
    const cache = caches.default;
    const cacheKey = cacheKeyFor(upstreamUrl);

    if (!bypassCache) {
      let cached: Response | undefined;
      try {
        cached = await cache.match(cacheKey);
      } catch {
        cached = undefined;
      }
      if (cached) {
        return respond(cached.body, cached.status, origin.origin, { upstream: cached, cache: 'HIT' });
      }
    }

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      if (isTimeout(error)) {
        return fail(504, 'upstream_timeout', 'The upstream API did not respond in time.', origin.origin, 'MISS');
      }
      return fail(502, 'upstream_unreachable', 'The upstream API could not be reached.', origin.origin, 'MISS');
    }

    if (!bypassCache && upstream.status === 200) {
      const headers = copiedHeaders(upstream);
      headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      try {
        await cache.put(cacheKey, new Response(upstream.clone().body, { status: 200, headers }));
      } catch {
        // A cache write failure must not fail a valid proxy response.
      }
    }

    return respond(upstream.body, upstream.status, origin.origin, { upstream, cache: 'MISS' });
  },
};
