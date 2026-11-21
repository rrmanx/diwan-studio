import { Button } from './button';

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
}

const DEFAULT = 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.';

export function ErrorState({ message = DEFAULT, title = 'تعذّر العرض', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="border-y border-rule py-12 text-center">
      <p className="font-display text-xl font-normal text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-base text-ink-2">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            أعد المحاولة
          </Button>
        </div>
      )}
    </div>
  );
}
