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
}

export interface Poem extends Omit<PoemSummary, 'excerpt'> {
  text: string;
}

export interface Quote {
  id: Id;
  title: string;
  text: string;
  topic: string | null;
  author: { id: number | null; name: string };
  attribution: Attribution;
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
  request_id?: string;
}
