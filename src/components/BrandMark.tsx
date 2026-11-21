export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-ink"
    >
      <rect x="14" y="1.5" width="7" height="7" transform="rotate(45 17.5 5)" fill="currentColor" />
      <rect x="2" y="18" width="20" height="3" fill="currentColor" />
    </svg>
  );
}
