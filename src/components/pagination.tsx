import { Button } from './button';

interface PaginationProps {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, lastPage, onChange }: PaginationProps) {
  return (
    <nav aria-label="صفحات النتائج" className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        ariaLabel="الصفحة السابقة"
      >
        السابق
      </Button>
      <span className="font-ui text-[11px] text-ink-3">
        صفحة {page} من {lastPage}
      </span>
      <Button
        variant="secondary"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        ariaLabel="الصفحة التالية"
      >
        التالي
      </Button>
    </nav>
  );
}
