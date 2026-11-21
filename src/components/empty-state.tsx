import { Button } from './button';

interface EmptyStateProps {
  message?: string;
  action?: { to: string; label: string };
}

const DEFAULT = 'لم نجد شيئًا بهذا النص. جرّب اسم شاعر، أو ابدأ من الأروقة.';

export function EmptyState({ message = DEFAULT, action }: EmptyStateProps) {
  return (
    <div className="border-y border-rule py-12 text-center">
      <p className="mx-auto max-w-xl text-base text-ink-2">{message}</p>
      {action && (
        <div className="mt-5 flex justify-center">
          <Button as="link" to={action.to} variant="secondary">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
