export type Id = string | number;

export interface Attribution {
  required: boolean;
  text: string;
  url: string;
}

export interface PoemSummary {
  id: Id;
  title: string;
  poet: { id: Id; name: string };
  era: { id: Id; name: string };
  meter: string | null;
  rhyme: string | null;
  display_layout: 'hemistichs' | 'lines' | 'stanzas';
  excerpt: string;
  attribution: Attribution;
  source: 'demo' | 'live';
  rights: 'public-domain' | 'api' | 'user';
}

export interface Poem extends Omit<PoemSummary, 'excerpt'> {
  text: string;
  verses?: string[][];
}

export interface Quote {
  id: Id;
  title: string;
  text: string;
  topic: string | null;
  author: { id: number | null; name: string };
  attribution: Attribution;
  source: 'demo' | 'live';
  rights: 'public-domain' | 'api' | 'user';
}

export interface Poet {
  id: Id;
  name: string;
  era: Era;
  poem_count?: number;
}

export interface Era {
  id: Id;
  name: string;
}

export interface MeterOption {
  name: string;
}

export interface RhymeOption {
  letter: string;
}

export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  request_id?: string;
  limit?: number;
  used?: number;
  remaining?: number;
  reset_at?: string;
}
