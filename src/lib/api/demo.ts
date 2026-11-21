/**
 * Demo data is public-domain classical heritage text bundled for preview.
 * It is NOT an AlDiwan API response and must never be presented as one.
 */
import erasJson from '../../data/demo/eras.json';
import metersJson from '../../data/demo/meters.json';
import poetsJson from '../../data/demo/poets.json';
import poemsJson from '../../data/demo/poems.json';
import quotesJson from '../../data/demo/quotes.json';
import rhymesJson from '../../data/demo/rhymes.json';
import type { ApiError, Era, Id, MeterOption, Poem, PoemSummary, Poet, Quote, RhymeOption } from '../types';
import type { DataProvider, Page, PoemFilters, ProviderResponse, QuoteSort } from './contract';

type DemoPoem = Omit<PoemSummary, 'source' | 'rights'> & { text?: string; verses?: string[][] };
type DemoPoet = { id: Id; name: string; era: string };

// JSON imports infer widened primitives, so cast them once at this typed boundary.
const poems = poemsJson as DemoPoem[];
const quotes = quotesJson as Quote[];
const poets = poetsJson as DemoPoet[];
const eras = erasJson as Era[];
const meters = metersJson as MeterOption[];
const rhymes = rhymesJson as RhymeOption[];

function latency(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 60 + Math.random() * 120);
  });
}

async function respond<T>(data: T): Promise<ProviderResponse<T>> {
  await latency();
  return { data, status: 200, cached: false };
}

function notFound(label: string): never {
  const error: ApiError = { code: 'not_found', message: `${label} غير موجود في المعاينة.` };
  throw error;
}

function same(a: unknown, b: unknown): boolean {
  return a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);
}

function searchable(poem: DemoPoem): string {
  return [poem.title, poem.poet.name, poem.excerpt, poem.text ?? '']
    .join(' ')
    .toLowerCase();
}

function filterPoems(filters: PoemFilters): DemoPoem[] {
  const query = filters.q?.trim().toLowerCase();
  return poems.filter((poem) => {
    if (filters.poet_id !== undefined && !same(poem.poet.id, filters.poet_id)) return false;
    if (
      filters.era_id !== undefined &&
      !same(poem.era.name, filters.era_id) &&
      !same(poem.era.id, filters.era_id)
    ) {
      return false;
    }
    if (filters.meter && poem.meter?.toLowerCase() !== filters.meter.toLowerCase()) return false;
    if (filters.rhyme && poem.rhyme?.toLowerCase() !== filters.rhyme.toLowerCase()) return false;
    if (query && !searchable(poem).includes(query)) return false;
    return true;
  });
}

function paginate<T>(items: T[], page = 1, perPage = 20): Page<T> {
  const current = Math.max(1, Math.floor(page));
  const size = Math.max(1, Math.floor(perPage));
  const total = items.length;
  const start = (current - 1) * size;
  return {
    data: items.slice(start, start + size),
    meta: {
      current_page: current,
      per_page: size,
      total,
      last_page: Math.max(1, Math.ceil(total / size)),
    },
  };
}

function allPoets(): Poet[] {
  const counts = new Map<string, number>();
  for (const poem of poems) {
    const key = String(poem.poet.id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return poets.map((poet) => ({
    id: poet.id,
    name: poet.name,
    era: eras.find((era) => era.name === poet.era) ?? { id: poet.era, name: poet.era },
    poem_count: counts.get(String(poet.id)) ?? 0,
  }));
}

function toSummary(poem: DemoPoem): PoemSummary {
  return { ...poem, source: 'demo', rights: 'public-domain' };
}

function toPoem(poem: DemoPoem): Poem {
  return { ...toSummary(poem), text: poem.text ?? '', verses: poem.verses };
}

function toQuote(quote: Quote): Quote {
  return { ...quote, source: 'demo', rights: 'public-domain' };
}

function sortQuotes(items: Quote[], sort?: QuoteSort): Quote[] {
  const copy = [...items];
  if (sort === 'random') return copy.sort(() => Math.random() - 0.5);
  if (sort === 'oldest') {
    return copy.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  }
  return copy.sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }));
}

function findPoem(id: Id): DemoPoem {
  const poem = poems.find((item) => same(item.id, id));
  if (!poem) notFound('القصيدة');
  return poem;
}

export const demoProvider: DataProvider = {
  listPoets: ({ page, per_page, q } = {}) => {
    const term = q?.trim().toLowerCase();
    const matches = term ? allPoets().filter((poet) => poet.name.toLowerCase().includes(term)) : allPoets();
    return respond(paginate(matches, page, per_page));
  },

  getPoet: (id) => {
    const poet = allPoets().find((item) => same(item.id, id));
    if (!poet) notFound('الشاعر');
    return respond(poet);
  },

  listPoetPoems: (id, { page, per_page } = {}) =>
    respond(paginate(poems.filter((poem) => same(poem.poet.id, id)).map(toSummary), page, per_page)),

  listPoems: (filters = {}) =>
    respond(paginate(filterPoems(filters).map(toSummary), filters.page, filters.per_page)),

  countPoems: (filters = {}) => respond({ count: filterPoems(filters).length }),

  poemIds: (filters = {}) => respond(filterPoems(filters).map((poem) => poem.id)),

  getPoem: (id) => respond(toPoem(findPoem(id))),

  search: (q, { type = 'all', per_page = 20 } = {}) => {
    const term = q.trim().toLowerCase();
    const foundPoems = term ? poems.filter((poem) => searchable(poem).includes(term)) : [];
    const foundPoets = term
      ? allPoets().filter((poet) => poet.name.toLowerCase().includes(term))
      : [];
    return respond({
      poems: type === 'poets' ? [] : foundPoems.slice(0, per_page).map(toSummary),
      poets: type === 'poems' ? [] : foundPoets.slice(0, per_page),
      total: (type === 'poets' ? 0 : foundPoems.length) + (type === 'poems' ? 0 : foundPoets.length),
    });
  },

  listQuotes: ({ page, per_page, author_id, topic, sort } = {}) => {
    const needle = topic?.trim().toLowerCase();
    const matches = quotes.filter((quote) => {
      if (author_id !== undefined && !same(quote.author.id, author_id)) return false;
      if (needle && quote.topic?.toLowerCase() !== needle) return false;
      return true;
    });
    return respond(paginate(sortQuotes(matches, sort).map(toQuote), page, per_page));
  },

  randomQuote: () => {
    if (quotes.length === 0) notFound('الاقتباس');
    return respond(toQuote(quotes[Math.floor(Math.random() * quotes.length)]));
  },

  getQuote: (id) => {
    const quote = quotes.find((item) => same(item.id, id));
    if (!quote) notFound('الاقتباس');
    return respond(toQuote(quote));
  },

  listEras: () => respond(eras),
  listMeters: () => respond(meters),
  listRhymes: () => respond(rhymes),
};
