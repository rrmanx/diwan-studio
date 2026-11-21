const WIDTHS = ['70%', '92%', '48%'];

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-4 py-4">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-3 animate-pulse bg-paper-sunk motion-reduce:animate-none"
          style={{ width: WIDTHS[index % WIDTHS.length] }}
        />
      ))}
    </div>
  );
}
