import { useTopbar } from '../components/app-shell';
import { Button } from '../components/button';
import { HowItWorks } from '../components/how-it-works';
import styles from './preview-page.module.css';

const DOWNLOAD_CLASS =
  'font-ui inline-flex min-h-8 items-center justify-center border border-rule bg-transparent px-3 text-[12px] leading-none text-ink transition-colors duration-150 hover:border-rule-strong hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export function PreviewPage() {
  useTopbar('معاينة');

  return (
    <div className="w-full">
      <p className="m-0 mb-4 font-body text-[15px] leading-6 text-ink-2">
        هكذا يبدو الاستوديو في الاستخدام: اختر، صمّم، صدّر.
      </p>

      <div className={styles.frame}>
        <div className={styles.crop}>
          <HowItWorks />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button as="link" to="/studio" variant="secondary" size="sm">
          افتح الاستوديو
        </Button>
        <a href="/stageshow/poster.png" download="poster.png" className={DOWNLOAD_CLASS}>
          حمّل الصورة
        </a>
      </div>
    </div>
  );
}
