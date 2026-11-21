import type { ApiError, Era, Id, PageMeta, PoemSummary, Poet, RhymeOption } from '../types';
import type { DataProvider, Page, ProviderResponse, Quota, Query } from './contract';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';
const TIMEOUT_MS = 12000;
const PROBE_TIMEOUT_MS = 2500;

type Provenance = { source: 'live'; rights: 'api' };
const provenance: Provenance = { source: 'live', rights: 'api' };

// Proxy payloads keep their contract; provenance is stamped client-side on every item.
function mark(value: unknown): unknown {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? { ...value, ...provenance }
    : value;
}

function stampResponse(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mark);
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.data)) return { ...record, data: record.data.map(mark) };
  if (Array.isArray(record.poems) || Array.isArray(record.poets)) {
    return {
      ...record,
      poems: Array.isArray(record.poems) ? record.poems.map(mark) : record.poems,
      poets: Array.isArray(record.poets) ? record.poets.map(mark) : record.poets,
    };
  }
  return mark(value);
}

interface RawResponse<T> extends ProviderResponse<T> {
  meta?: PageMeta;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function integer(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function iso(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

function hasQuota(quota: Quota): boolean {
  return Object.values(quota).some((value) => value !== undefined);
}

function metaFrom(value: Record<string, unknown>): PageMeta | undefined {
  if (Object.keys(value).length === 0) return undefined;
  return {
    current_page: integer(value.current_page) ?? 1,
    per_page: integer(value.per_page) ?? 20,
    total: integer(value.total) ?? 0,
    last_page: integer(value.last_page) ?? 1,
  };
}

/** Exact header names emitted by the AlDiwan proxy. */
function quotaFrom(headers: Headers, record: Record<string, unknown>): Quota | undefined {
  const error = asRecord(record.error);
  const number = (name: string, ...fallbacks: unknown[]) =>
    integer(headers.get(name) ?? fallbacks.find((value) => value !== undefined));
  const date = (name: string, ...fallbacks: unknown[]) =>
    iso(headers.get(name) ?? fallbacks.find((value) => value !== undefined));

  const quota: Quota = {
    general: number('x-monthlyquota-remaining', record.general, record.general_remaining, error.remaining),
    generalLimit: number('x-monthlyquota-limit', record.general_limit, error.limit),
    generalReset: date('x-monthlyquota-reset', record.general_reset, error.reset_at),
    fullTextDaily: number(
      'x-fulltextquota-daily-remaining',
      record.fullTextDaily,
      record.full_text_daily,
      record.full_text_daily_remaining,
    ),
    fullTextDailyLimit: number('x-fulltextquota-daily-limit', record.full_text_daily_limit),
    fullTextDailyReset: date('x-fulltextquota-daily-reset', record.full_text_daily_reset),
    fullTextMonthly: number(
      'x-fulltextquota-monthly-remaining',
      record.fullTextMonthly,
      record.full_text_monthly,
      record.full_text_monthly_remaining,
    ),
    fullTextMonthlyLimit: number('x-fulltextquota-monthly-limit', record.full_text_monthly_limit),
    fullTextMonthlyReset: date('x-fulltextquota-monthly-reset', record.full_text_monthly_reset),
  };
  return hasQuota(quota) ? quota : undefined;
}

const DEFAULT_ERROR = 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.';
const QUOTA_ERROR = 'انتهت الحصة المتاحة للديوان. تُجدَّد الحصة في وقت إعادة الضبط.';

function failure(status: number, body: unknown): ApiError {
  const record = asRecord(body);
  const error = asRecord(record.error);
  const rawCode = text(error.code) ?? text(record.code) ?? '';
  const quotaError =
    status === 429 || rawCode === 'quota_exceeded' || rawCode === 'full_text_quota_exceeded';
  const code = quotaError
    ? rawCode === 'full_text_quota_exceeded'
      ? 'full_text_quota_exceeded'
      : 'quota_exceeded'
    : rawCode || `http_${status}`;

  return {
    status,
    code,
    message: text(error.message) ?? text(record.message) ?? (quotaError ? QUOTA_ERROR : DEFAULT_ERROR),
    request_id: text(error.request_id) ?? text(record.request_id),
    limit: integer(error.limit),
    used: integer(error.used),
    remaining: integer(error.remaining),
    reset_at: text(error.reset_at),
  };
}

function isTimeout(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: unknown }).name === 'TimeoutError'
  );
}

function timeoutError(): ApiError {
  return { code: 'client_timeout', message: 'تأخّر ردّ الديوان…' };
}

async function get<T>(path: string, query: Query, timeoutMs = TIMEOUT_MS): Promise<RawResponse<T>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}${search ? `?${search}` : ''}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeout(error)) throw timeoutError();
    throw { code: 'network_error', message: DEFAULT_ERROR } satisfies ApiError;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw failure(response.status, body);

  const record = asRecord(body);
  const data = 'data' in record ? record.data : body;
  const requestId =
    response.headers.get('x-request-id') ??
    text(record.request_id) ??
    text(asRecord(record.error).request_id);

  return {
    data: stampResponse(data) as T, // the proxy is responsible for the typed contract at this boundary
    status: response.status,
    requestId,
    quota: quotaFrom(response.headers, record),
    cached: response.headers.get('x-proxy-cache') === 'HIT',
    meta: metaFrom(asRecord(record.meta)),
  };
}

/** Startup reachability check; no key, no credentials, 2.5s hard timeout. */
export function probeLive(): Promise<ProviderResponse<unknown>> {
  return get<unknown>('/eras', {}, PROBE_TIMEOUT_MS);
}

async function getPage<T>(path: string, query: Query): Promise<ProviderResponse<Page<T>>> {
  const response = await get<unknown>(path, query);
  const record = asRecord(response.data);
  const items = Array.isArray(response.data)
    ? response.data
    : Array.isArray(record.data)
      ? record.data
      : [];
  const { meta, ...rest } = response;
  return {
    ...rest,
    data: {
      data: items as T[], // endpoint payloads are homogeneous by contract
      meta: meta ?? {
        current_page: 1,
        per_page: items.length,
        total: items.length,
        last_page: 1,
      },
    },
  };
}

const segment = (id: Id) => encodeURIComponent(String(id));

// Rhyme values from the upstream feed include junk; keep Arabic letters only.
const ARABIC_LETTER = /^(?:ال)?[\u0600-\u06FF]+$/u;
const NON_LETTER = /[\u0660-\u0669\u06F0-\u06F9\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u0640]/u;

function arabicRhyme(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const letter = value.trim();
  return ARABIC_LETTER.test(letter) && !NON_LETTER.test(letter) ? letter : undefined;
}

export const liveProvider: DataProvider = {
  listPoets: ({ page, per_page, q } = {}) => getPage('/poets', { page, per_page, q }),
  getPoet: (id) => get(`/poets/${segment(id)}`, {}),
  listPoetPoems: (id, { page, per_page } = {}) =>
    getPage(`/poets/${segment(id)}/poems`, { page, per_page }),
  listPoems: ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) =>
    getPage('/poems', { page, per_page, era_id, meter, rhyme, poet_id, q, sort }),
  countPoems: ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) =>
    get('/poems/count', { page, per_page, era_id, meter, rhyme, poet_id, q, sort }),
  poemIds: async ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) => {
    const response = await get<unknown>('/poems/slugs', {
      page,
      per_page,
      era_id,
      meter,
      rhyme,
      poet_id,
      q,
      sort,
    });
    const items = Array.isArray(response.data) ? response.data : [];
    const ids = items.map((item) => {
      const record = asRecord(item);
      return (record.id ?? record.slug ?? item) as Id;
    });
    return { ...response, data: ids };
  },
  getPoem: (id) => get(`/poems/${segment(id)}`, {}),
  search: async (q, { type, per_page } = {}) => {
    const response = await get<unknown>('/search', { q, type, per_page });
    const payload = asRecord(response.data);
    const poems = (Array.isArray(payload.poems) ? payload.poems.map(mark) : []) as PoemSummary[];
    const poets = (Array.isArray(payload.poets) ? payload.poets.map(mark) : []) as Poet[];
    return {
      ...response,
      data: {
        poems,
        poets,
        total: integer(payload.total) ?? poems.length + poets.length,
      },
    };
  },
  listQuotes: ({ page, per_page, author_id, topic, sort } = {}) =>
    getPage('/quotes', { page, per_page, author_id, topic, sort }),
  randomQuote: () => get('/quotes/random', {}),
  getQuote: (id) => get(`/quotes/${segment(id)}`, {}),
  listEras: async () => {
    const response = await get<unknown>('/eras', {});
    const items = Array.isArray(response.data) ? response.data : asRecord(response.data).data;
    const eras = (Array.isArray(items) ? items : []).filter((item): item is Era => {
      const era = asRecord(item);
      return era.id !== undefined && typeof era.name === 'string' && era.name.trim() !== '';
    });
    return { ...response, data: eras };
  },
  listMeters: () => get('/meters', {}),
  listRhymes: async () => {
    const response = await get<unknown>('/rhymes', {});
    const items = Array.isArray(response.data) ? response.data : asRecord(response.data).data;
    const seen = new Set<string>();
    const rhymes: RhymeOption[] = [];
    for (const item of Array.isArray(items) ? items : []) {
      const letter = arabicRhyme(asRecord(item).letter);
      if (letter && !seen.has(letter)) {
        seen.add(letter);
        rhymes.push({ letter });
      }
    }
    return { ...response, data: rhymes };
  },
};
