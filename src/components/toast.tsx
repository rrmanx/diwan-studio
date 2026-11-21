export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="font-ui fixed bottom-6 left-6 z-50 border border-rule bg-paper-raised px-4 py-3 text-sm text-ink"
    >
      {message}
    </div>
  );
}
