import { PagePlaceholder } from '../components/PagePlaceholder';

export function NotFoundPage() {
  return (
    <PagePlaceholder
      title="غير موجود"
      intro="لم نجد هذه الصفحة. يمكنك العودة إلى الرئيسية أو تصفّح القصائد."
    />
  );
}
