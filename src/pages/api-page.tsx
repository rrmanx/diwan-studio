import { useSyncExternalStore } from 'react';
import {
  getMode,
  getModeReason,
  setMode,
  subscribeMode,
  type Mode,
  type ModeReason,
} from '../lib/api/client';
import type { Quota } from '../lib/api/contract';
import { useInspector } from '../lib/inspector';
import { canExport, EXPORT_API_TEXT, type ExportRights } from '../lib/rights';

const MODE_LABELS: Record<Mode, string> = { live: 'مباشر', demo: 'معاينة' };
const REASON_LABELS: Record<ModeReason, string> = {
  configured: 'بحسب الإعداد',
  override: 'اختيار صريح',
  cache: 'محفوظ في هذه الجلسة',
  probing: 'جارٍ التحقق من الديوان…',
  'probe-ok': 'تحقّقنا من اتصال الديوان',
  unreachable: 'تعذّر الوصول — بيانات المعاينة',
};

const ENDPOINTS = [
  '/eras', '/meters', '/rhymes', '/poems', '/poems/slugs', '/poems/count',
  '/poems/{id}', '/search', '/poets', '/quotes', '/quotes/random',
];

const RIGHTS: { rights: ExportRights; label: string }[] = [
  { rights: 'api', label: 'نصوص الديوان API' },
  { rights: 'public-domain', label: 'نص تراثي من الملك العام' },
  { rights: 'user', label: 'نصّ المستخدم' },
];

function formatReset(value?: string): string {
  if (!value) return '—';
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'short' }).format(new Date(time));
}

function quotaValue(remaining?: number, limit?: number): string {
  if (remaining === undefined && limit === undefined) return '—';
  return `${remaining ?? '—'} / ${limit ?? '—'}`;
}

function QuotaRow({
  label,
  remaining,
  limit,
  reset,
}: {
  label: string;
  remaining?: number;
  limit?: number;
  reset?: string;
}) {
  return (
    <tr className="border-b border-rule last:border-b-0">
      <th scope="row" className="py-2.5 text-start font-normal text-ink-2">{label}</th>
      <td dir="ltr" className="py-2.5 text-start font-mono text-[12px] text-ink">{quotaValue(remaining, limit)}</td>
      <td className="py-2.5 text-start text-[12px] text-ink-2">{formatReset(reset)}</td>
    </tr>
  );
}

export function ApiPage() {
  const mode = useSyncExternalStore(subscribeMode, getMode, getMode);
  const reason = useSyncExternalStore(subscribeMode, getModeReason, getModeReason);
  const entries = useInspector();
  const latestQuota: Quota | undefined = entries.find((entry) => entry.quota)?.quota;
  const chip = mode === 'demo' && reason === 'unreachable'
    ? 'معاينة: تعذّر الوصول'
    : MODE_LABELS[mode];

  return (
    <section className="container-page py-12 sm:py-16">
      <header>
        <p className="font-ui text-[11px] tracking-[.14em] text-ink-3">التكامل</p>
        <h1 className="font-display mt-3 text-[34px] font-normal tracking-tight text-ink">الديوان API</h1>
        <p className="mt-4 max-w-2xl leading-loose text-ink-2">
          يعمل التطبيق مباشرةً مع الديوان حين يتاح الاتصال، ويعود تلقائيًا إلى بيانات المعاينة المحلية عند تعذّره.
          المفتاح موجود في الـ Worker وحده، ولا يُرسل إلى المتصفح.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-rule py-4">
        <span className={`font-ui inline-flex items-center gap-2 border px-3 py-1.5 text-xs ${
          mode === 'live' ? 'border-ink text-ink' : 'border-rule text-ink-2'
        }`}>
          <span className="dot" aria-hidden="true" />
          {chip}
        </span>
        <span className="font-ui text-xs text-ink-2">{REASON_LABELS[reason]}</span>
        <div className="font-ui ms-auto flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('live')}
            className="border border-rule px-3 py-1.5 text-ink hover:border-ink"
          >
            تجربة مباشر
          </button>
          <button
            type="button"
            onClick={() => setMode('demo')}
            className="border border-rule px-3 py-1.5 text-ink-2 hover:border-ink hover:text-ink"
          >
            العودة للمعاينة
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-ui text-[11px] tracking-[.14em] text-ink-3">الحصة المتبقية</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/20 font-ui text-[11px] text-ink-3">
                <th scope="col" className="py-2 text-start font-normal">الحد</th>
                <th scope="col" className="py-2 text-start font-normal">المتبقي / الإجمالي</th>
                <th scope="col" className="py-2 text-start font-normal">إعادة الضبط</th>
              </tr>
            </thead>
            <tbody>
              <QuotaRow label="عام" remaining={latestQuota?.general} limit={latestQuota?.generalLimit} reset={latestQuota?.generalReset} />
              <QuotaRow label="نصوص كاملة — يومي" remaining={latestQuota?.fullTextDaily} limit={latestQuota?.fullTextDailyLimit} reset={latestQuota?.fullTextDailyReset} />
              <QuotaRow label="نصوص كاملة — شهري" remaining={latestQuota?.fullTextMonthly} limit={latestQuota?.fullTextMonthlyLimit} reset={latestQuota?.fullTextMonthlyReset} />
            </tbody>
          </table>
          <h2 className="font-ui mt-10 text-[11px] tracking-[.14em] text-ink-3">نقاط النهاية</h2>
          <ul className="font-mono mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-ink-2">
            {ENDPOINTS.map((endpoint) => <li key={endpoint} dir="ltr">{endpoint}</li>)}
          </ul>
        </div>

        <div id="rights">
          <h2 className="font-ui text-[11px] tracking-[.14em] text-ink-3">الحقوق والتصدير</h2>
          <p className="mt-3 text-sm leading-loose text-ink-2">
            تصدير نصوص الديوان API: {EXPORT_API_TEXT ? 'مسموح' : 'غير مسموح'}. تظهر النصوص المسموح تصديرها في الاستوديو؛
            نصوص API تبقى للعرض مع إسناد المصدر.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {RIGHTS.map(({ rights, label }) => {
              const gate = canExport({ rights });
              return (
                <li key={rights} className="flex flex-wrap items-baseline gap-x-3 border-b border-rule pb-2">
                  <span className="text-ink">{label}</span>
                  <span className={gate.ok ? 'text-ink-2' : 'text-accent'}>
                    {gate.ok ? 'قابل للتصدير' : gate.reason}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-ui text-[11px] tracking-[.14em] text-ink-3">سجل الطلبات</h2>
        <p className="mt-2 text-xs text-ink-2">يتضمّن فحص الاتصال عند بدء التشغيل وقرار اختيار المصدر.</p>
        <div className="mt-3 overflow-x-auto border border-rule">
          <table className="w-full min-w-[620px] border-collapse text-start text-[12px]">
            <thead className="font-ui bg-paper-sunk text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-normal">الوقت</th>
                <th scope="col" className="px-3 py-2 text-start font-normal">المصدر</th>
                <th scope="col" className="px-3 py-2 text-start font-normal">المسار</th>
                <th scope="col" className="px-3 py-2 text-start font-normal">الحالة</th>
                <th scope="col" className="px-3 py-2 text-start font-normal">المدة</th>
                <th scope="col" className="px-3 py-2 text-start font-normal">ملاحظة</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-5 text-center font-ui text-ink-3">لا توجد طلبات بعد.</td></tr>
              ) : entries.map((entry) => (
                <tr key={entry.id} className="border-t border-rule align-top">
                  <td className="px-3 py-2 text-ink-3">{new Date(entry.at).toLocaleTimeString('ar-SA')}</td>
                  <td className="px-3 py-2 text-ink-2">{entry.source}</td>
                  <td dir="ltr" className="px-3 py-2 text-start text-ink">{entry.path}</td>
                  <td className="px-3 py-2 text-ink-2">{entry.status ?? '—'}</td>
                  <td className="px-3 py-2 text-ink-3">{entry.ms}ms</td>
                  <td className="px-3 py-2 font-ui text-ink-2">
                    {entry.error ?? (entry.cached ? 'من ذاكرة الوكيل' : '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
