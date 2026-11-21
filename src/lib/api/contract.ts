import type {
  Era,
  Id,
  MeterOption,
  PageMeta,
  Poem,
  PoemSummary,
  Poet,
  Quote,
  RhymeOption,
} from '../types';

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

export interface Quota {
  general?: number;
  fullTextDaily?: number;
  fullTextMonthly?: number;
}

export interface ProviderResponse<T> {
  data: T;
  status: number;
  requestId?: string;
  quota?: Quota;
  cached: boolean;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface Pagination {
  page?: number;
  per_page?: number;
}

export interface PoetListParams extends Pagination {
  q?: string;
}

export interface PoemFilters extends Pagination {
  era_id?: string;
  meter?: string;
  rhyme?: string;
  poet_id?: Id;
  q?: string;
  sort?: string;
}

export type SearchType = 'all' | 'poems' | 'poets';

export interface SearchParams {
  type?: SearchType;
  per_page?: number;
}

export interface SearchResults {
  poems: PoemSummary[];
  poets: Poet[];
  total: number;
}

export type QuoteSort = 'newest' | 'oldest' | 'random';

export interface QuoteListParams extends Pagination {
  author_id?: Id;
  topic?: string;
  sort?: QuoteSort;
}

export interface DataProvider {
  listPoets(params: PoetListParams): Promise<ProviderResponse<Page<Poet>>>;
  getPoet(id: Id): Promise<ProviderResponse<Poet>>;
  listPoetPoems(id: Id, params: Pagination): Promise<ProviderResponse<Page<PoemSummary>>>;
  listPoems(filters: PoemFilters): Promise<ProviderResponse<Page<PoemSummary>>>;
  countPoems(filters: PoemFilters): Promise<ProviderResponse<{ count: number }>>;
  poemIds(filters: PoemFilters): Promise<ProviderResponse<Id[]>>;
  getPoem(id: Id): Promise<ProviderResponse<Poem>>;
  search(q: string, params: SearchParams): Promise<ProviderResponse<SearchResults>>;
  listQuotes(params: QuoteListParams): Promise<ProviderResponse<Page<Quote>>>;
  randomQuote(): Promise<ProviderResponse<Quote>>;
  getQuote(id: Id): Promise<ProviderResponse<Quote>>;
  listEras(): Promise<ProviderResponse<Era[]>>;
  listMeters(): Promise<ProviderResponse<MeterOption[]>>;
  listRhymes(): Promise<ProviderResponse<RhymeOption[]>>;
}

export interface LogEntry {
  id: string;
  at: string;
  method: 'GET';
  path: string;
  query: Query;
  status: number | null;
  ms: number;
  requestId?: string;
  quota?: Quota;
  cached: boolean;
  source: 'demo' | 'live';
  error?: string;
}
