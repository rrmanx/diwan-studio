import type { ApiError, Id, PageMeta } from '../types';
import type { DataProvider, Page, ProviderResponse, Quota, Query } from './contract';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

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

function metaFrom(value: Record<string, unknown>): PageMeta | undefined {
  if (Object.keys(value).length === 0) return undefined;
  return {
    current_page: integer(value.current_page) ?? 1,
    per_page: integer(value.per_page) ?? 20,
    total: integer(value.total) ?? 0,
    last_page: integer(value.last_page) ?? 1,
  };
}

function failure(status: number, body: unknown): ApiError & { status: number } {
  const record = asRecord(body);
  return {
    status,
    code: typeof record.code === 'string' ? record.code : `http_${status}`,
    message:
      typeof record.message === 'string'
        ? record.message
        : 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.',
    request_id: typeof record.request_id === 'string' ? record.request_id : undefined,
  };
}

function quotaFrom(headers: Headers, record: Record<string, unknown>): Quota | undefined {
  const quota: Quota = {
    general: integer(headers.get('x-ratelimit-remaining') ?? record.general),
    fullTextDaily: integer(
      headers.get('x-aldiwan-fulltext-daily-remaining') ??
        record.fullTextDaily ??
        record.full_text_daily,
    ),
    fullTextMonthly: integer(
      headers.get('x-aldiwan-fulltext-monthly-remaining') ??
        record.fullTextMonthly ??
        record.full_text_monthly,
    ),
  };
  return Object.values(quota).some((value) => value !== undefined) ? quota : undefined;
}

async function get<T>(path: string, query: Query): Promise<RawResponse<T>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  const response = await fetch(`${BASE}${path}${search ? `?${search}` : ''}`, {
    headers: { Accept: 'application/json' },
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw failure(response.status, body);

  const record = asRecord(body);
  const data = !Array.isArray(body) && 'data' in record ? record.data : body;
  const headerRequestId = response.headers.get('x-request-id');
  const requestId =
    headerRequestId ?? (typeof record.request_id === 'string' ? record.request_id : undefined);

  return {
    data: data as T, // the proxy is responsible for the typed contract at this boundary
    status: response.status,
    requestId,
    quota: quotaFrom(response.headers, record),
    cached: false,
    meta: metaFrom(asRecord(record.meta)),
  };
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

export const liveProvider: DataProvider = {
  listPoets: ({ page, per_page, q } = {}) => getPage('/poets', { page, per_page, q }),
  getPoet: (id) => get(`/poets/${segment(id)}`, {}),
  listPoetPoems: (id, { page, per_page } = {}) =>
    getPage(`/poets/${segment(id)}/poems`, { page, per_page }),
  listPoems: ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) =>
    getPage('/poems', { page, per_page, era_id, meter, rhyme, poet_id, q, sort }),
  countPoems: ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) =>
    get('/poems/count', { page, per_page, era_id, meter, rhyme, poet_id, q, sort }),
  poemIds: ({ page, per_page, era_id, meter, rhyme, poet_id, q, sort } = {}) =>
    get('/poems/ids', { page, per_page, era_id, meter, rhyme, poet_id, q, sort }),
  getPoem: (id) => get(`/poems/${segment(id)}`, {}),
  search: (q, { type, per_page } = {}) => get('/search', { q, type, per_page }),
  listQuotes: ({ page, per_page, author_id, topic, sort } = {}) =>
    getPage('/quotes', { page, per_page, author_id, topic, sort }),
  randomQuote: () => get('/quotes/random', {}),
  getQuote: (id) => get(`/quotes/${segment(id)}`, {}),
  listEras: () => get('/eras', {}),
  listMeters: () => get('/meters', {}),
  listRhymes: () => get('/rhymes', {}),
};
