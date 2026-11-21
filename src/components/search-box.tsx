import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';

const STORAGE_KEY = 'diwan:last-q';

function remember(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  onSubmit?: (query: string) => void;
}

export function SearchBox({ initialQuery = '', autoFocus = false, onSubmit }: SearchBoxProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => initialQuery || remember());

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    try {
      localStorage.setItem(STORAGE_KEY, term);
    } catch {
      // Browsers with storage disabled still get a working search.
    }
    if (onSubmit) onSubmit(term);
    else navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <form role="search" onSubmit={submit} className="flex w-full max-w-2xl items-center gap-2">
      <label htmlFor="diwan-search" className="font-ui sr-only">
        ابحث في الديوان
      </label>
      <input
        id="diwan-search"
        type="search"
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحث باسم شاعر أو قصيدة"
        className="font-ui h-10 min-w-0 flex-1 rounded-[2px] border border-rule-strong bg-paper-raised px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
      <Button type="submit" size="sm" ariaLabel="ابحث في الديوان">
        ابحث
      </Button>
    </form>
  );
}
