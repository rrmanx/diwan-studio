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
import { liveProvider, probeLive } from './live';

export type Mode = 'live' | 'demo';
export type ModeReason = 'configured' | 'override' | 'cache' | 'probing' | 'probe-ok' | 'unreachable';

interface ModeState {
  mode: Mode;
  reason: ModeReason;
}

interface CachedMode {
  mode: Mode;
  at: number;
  base: string;
}

const MODE_KEY = 'diwan:mode';
const CACHE_KEY = 'diwan:mode-cache';
const CACHE_TTL = 10 * 60 * 1000;
const API_BASE = String(import.meta.env.VITE_API_BASE ?? '/api');
const CONFIGURED = import.meta.env.VITE_DATA_SOURCE;
const WANTS_LIVE = CONFIGURED === 'live' || (!CONFIGURED && Boolean(import.meta.env.VITE_API_BASE));

function readOverride(): Mode | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(MODE_KEY);
    return value === 'live' || value === 'demo' ? value : undefined;
  } catch {
    return undefined;
  }
}

function readCache(): ModeState | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as Partial<CachedMode>;
    if (
      (cached.mode === 'live' || cached.mode === 'demo') &&
      cached.base === API_BASE &&
      typeof cached.at === 'number' &&
      Date.now() - cached.at < CACHE_TTL
    ) {
      return { mode: cached.mode, reason: 'cache' };
    }
  } catch {
    // Ignore corrupt or blocked storage.
  }
  return undefined;
}

function writeCache(mode: Mode): void {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedMode = { mode, at: Date.now(), base: API_BASE };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Private mode must not change the resolved source.
  }
}

function initialState(): ModeState {
  const override = readOverride();
  if (override) return { mode: override, reason: 'override' };
  if (CONFIGURED === 'demo' || !WANTS_LIVE) return { mode: 'demo', reason: 'configured' };
  return readCache() ?? { mode: 'live', reason: 'probing' };
}

let state: ModeState = initialState();
const modeListeners = new Set<() => void>();

export function subscribeMode(listener: () => void): () => void {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}

export function getMode(): Mode {
  return state.mode;
}

export function getModeReason(): ModeReason {
  return state.reason;
}

function setState(next: ModeState): void {
  if (next.mode === state.mode && next.reason === state.reason) return;
  state = next;
  for (const listener of modeListeners) listener();
}

/** Persist an explicit choice and restart so every stream uses the new provider. */
export function setMode(next: Mode): void {
  try {
    window.localStorage.setItem(MODE_KEY, next);
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Still reload: the in-memory override applies for this page load.
  }
  state = { mode: next, reason: 'override' };
  window.location.reload();
}

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

function newEntry(): Pick<LogEntry, 'id' | 'at' | 'method'> {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), method: 'GET' };
}

interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
}

function errorDetails(error: unknown): ErrorDetails {
  const fallback = 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.';
  if (error !== null && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    return {
      message: typeof value.message === 'string' ? value.message : fallback,
      code: typeof value.code === 'string' ? value.code : undefined,
      status: typeof value.status === 'number' ? value.status : undefined,
      requestId: typeof value.request_id === 'string' ? value.request_id : undefined,
    };
  }
  return { message: fallback };
}

function settle(next: ModeState, cache: boolean): ModeState {
  setState(next);
  if (cache) writeCache(next.mode);
  record({
    ...newEntry(),
    path: '/mode',
    query: { mode: next.mode, reason: next.reason },
    status: 200,
    ms: 0,
    cached: false,
    source: next.mode,
  });
  return next;
}

async function resolveMode(): Promise<ModeState> {
  const override = readOverride();
  if (override) return settle({ mode: override, reason: 'override' }, false);
  if (CONFIGURED === 'demo' || !WANTS_LIVE) {
    return settle({ mode: 'demo', reason: 'configured' }, false);
  }
  const cached = readCache();
  if (cached) return settle(cached, false);

  const started = performance.now();
  try {
    const probe = await probeLive();
    record({
      ...newEntry(),
      path: '/eras',
      query: { probe: 1 },
      status: probe.status,
      requestId: probe.requestId,
      quota: probe.quota,
      cached: probe.cached,
      source: 'live',
      ms: Math.round(performance.now() - started),
    });
    return settle({ mode: 'live', reason: 'probe-ok' }, true);
  } catch (error) {
    const details = errorDetails(error);
    record({
      ...newEntry(),
      path: '/eras',
      query: { probe: 1 },
      status: details.status ?? null,
      requestId: details.requestId,
      error: details.code ? `${details.code}: ${details.message}` : details.message,
      cached: false,
      source: 'live',
      ms: Math.round(performance.now() - started),
    });
    return settle({ mode: 'demo', reason: 'unreachable' }, true);
  }
}

const ready = resolveMode();

async function providerFor(): Promise<DataProvider> {
  const resolved = await ready;
  return resolved.mode === 'live' ? liveProvider : demoProvider;
}

async function run<T>(
  path: string,
  query: Query,
  call: (provider: DataProvider) => Promise<ProviderResponse<T>>,
): Promise<T> {
  const provider = await providerFor();
  const started = performance.now();
  const base = {
    ...newEntry(),
    path,
    query,
    ms: Math.round(performance.now() - started),
    cached: false,
    source: state.mode as LogEntry['source'],
  };

  try {
    const result = await call(provider);
    record({
      ...base,
      ms: Math.round(performance.now() - started),
      status: result.status,
      requestId: result.requestId,
      quota: result.quota,
      cached: result.cached,
      source: state.mode,
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
      source: state.mode,
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
    run('/poets', { page: params.page, per_page: params.per_page, q: params.q }, (provider) =>
      provider.listPoets(params),
    ),

  getPoet: (id: Id) => run(`/poets/${segment(id)}`, {}, (provider) => provider.getPoet(id)),

  listPoetPoems: (id: Id, params: Pagination = {}) =>
    run(`/poets/${segment(id)}/poems`, { page: params.page, per_page: params.per_page }, (provider) =>
      provider.listPoetPoems(id, params),
    ),

  listPoems: (filters: PoemFilters = {}) =>
    run('/poems', poemQuery(filters), (provider) => provider.listPoems(filters)),

  countPoems: (filters: PoemFilters = {}) =>
    run('/poems/count', poemQuery(filters), (provider) => provider.countPoems(filters)),

  poemIds: (filters: PoemFilters = {}) =>
    run('/poems/slugs', poemQuery(filters), (provider) => provider.poemIds(filters)),

  getPoem: (id: Id) => run(`/poems/${segment(id)}`, {}, (provider) => provider.getPoem(id)),

  search: (q: string, params: SearchParams = {}) =>
    run('/search', { q, type: params.type, per_page: params.per_page }, (provider) =>
      provider.search(q, params),
    ),

  listQuotes: (params: QuoteListParams = {}) =>
    run('/quotes', quoteQuery(params), (provider) => provider.listQuotes(params)),

  randomQuote: () => run('/quotes/random', {}, (provider) => provider.randomQuote()),

  getQuote: (id: Id) => run(`/quotes/${segment(id)}`, {}, (provider) => provider.getQuote(id)),

  listEras: () => run('/eras', {}, (provider) => provider.listEras()),

  listMeters: () => run('/meters', {}, (provider) => provider.listMeters()),

  listRhymes: () => run('/rhymes', {}, (provider) => provider.listRhymes()),
};

export type { SearchType };
