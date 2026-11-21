import type { Id } from '../types';
import type {
  DataProvider,
  LogEntry,
  PoemFilters,
  PoetListParams,
  ProviderResponse,
  Pagination,
  Query,
  QuoteListParams,
  SearchParams,
  SearchType,
} from './contract';
import { demoProvider } from './demo';
import { liveProvider } from './live';

const isLive = import.meta.env.VITE_DATA_SOURCE === 'live';
const provider: DataProvider = isLive ? liveProvider : demoProvider;
const source: LogEntry['source'] = isLive ? 'live' : 'demo';

const MAX_ENTRIES = 100;
let entries: LogEntry[] = [];
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getEntries(): LogEntry[] {
  return entries;
}

function record(entry: LogEntry): void {
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  for (const listener of listeners) listener();
}

interface ErrorDetails {
  message: string;
  status?: number;
  requestId?: string;
}

function errorDetails(error: unknown): ErrorDetails {
  const fallback = 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.';
  if (error !== null && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    return {
      message: typeof value.message === 'string' ? value.message : fallback,
      status: typeof value.status === 'number' ? value.status : undefined,
      requestId: typeof value.request_id === 'string' ? value.request_id : undefined,
    };
  }
  return { message: fallback };
}

async function run<T>(
  path: string,
  query: Query,
  call: () => Promise<ProviderResponse<T>>,
): Promise<T> {
  const started = performance.now();
  const base = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    method: 'GET' as const,
    path,
    query,
    ms: Math.round(performance.now() - started),
    cached: false,
    source,
  };

  try {
    const result = await call();
    record({
      ...base,
      ms: Math.round(performance.now() - started),
      status: result.status,
      requestId: result.requestId,
      quota: result.quota,
      cached: result.cached,
    });
    return result.data;
  } catch (error) {
    const details = errorDetails(error);
    record({
      ...base,
      ms: Math.round(performance.now() - started),
      status: details.status ?? null,
      requestId: details.requestId,
      error: details.message,
    });
    throw error;
  }
}

const segment = (id: Id) => encodeURIComponent(String(id));

function poemQuery(filters: PoemFilters): Query {
  return {
    page: filters.page,
    per_page: filters.per_page,
    era_id: filters.era_id,
    meter: filters.meter,
    rhyme: filters.rhyme,
    poet_id: filters.poet_id,
    q: filters.q,
    sort: filters.sort,
  };
}

function quoteQuery(params: QuoteListParams): Query {
  return {
    page: params.page,
    per_page: params.per_page,
    author_id: params.author_id,
    topic: params.topic,
    sort: params.sort,
  };
}

export const api = {
  listPoets: (params: PoetListParams = {}) =>
    run('/poets', { page: params.page, per_page: params.per_page, q: params.q }, () =>
      provider.listPoets(params),
    ),

  getPoet: (id: Id) => run(`/poets/${segment(id)}`, {}, () => provider.getPoet(id)),

  listPoetPoems: (id: Id, params: Pagination = {}) =>
    run(`/poets/${segment(id)}/poems`, { page: params.page, per_page: params.per_page }, () =>
      provider.listPoetPoems(id, params),
    ),

  listPoems: (filters: PoemFilters = {}) =>
    run('/poems', poemQuery(filters), () => provider.listPoems(filters)),

  countPoems: (filters: PoemFilters = {}) =>
    run('/poems/count', poemQuery(filters), () => provider.countPoems(filters)),

  poemIds: (filters: PoemFilters = {}) =>
    run('/poems/ids', poemQuery(filters), () => provider.poemIds(filters)),

  getPoem: (id: Id) => run(`/poems/${segment(id)}`, {}, () => provider.getPoem(id)),

  search: (q: string, params: SearchParams = {}) =>
    run('/search', { q, type: params.type, per_page: params.per_page }, () =>
      provider.search(q, params),
    ),

  listQuotes: (params: QuoteListParams = {}) =>
    run('/quotes', quoteQuery(params), () => provider.listQuotes(params)),

  randomQuote: () => run('/quotes/random', {}, () => provider.randomQuote()),

  getQuote: (id: Id) => run(`/quotes/${segment(id)}`, {}, () => provider.getQuote(id)),

  listEras: () => run('/eras', {}, () => provider.listEras()),

  listMeters: () => run('/meters', {}, () => provider.listMeters()),

  listRhymes: () => run('/rhymes', {}, () => provider.listRhymes()),
};

export type { SearchType };
