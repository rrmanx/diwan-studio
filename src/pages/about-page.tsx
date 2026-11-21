import { useTopbar } from '../components/app-shell';
import { HowItWorks } from '../components/how-it-works';
import { Footer } from '../components/Footer';

const FACTS = [
  ['البيانات', 'الديوان API — developers.aldiwan.net'],
  ['المعاينة', 'نصوص تراثية من الملك العام، غير منسوبة إلى الـ API'],
  ['الخطوط', 'ثمنية للواجهة، أميري وعارف رقعة للفن، IBM Plex Mono للـ API'],
  ['الخصوصية', 'آخر ما قرأت يُحفظ في متصفحك فقط'],
];

export function AboutPage() {
  useTopbar('عن المشروع');

  return (
    <div className="max-w-[68ch]">
      <HowItWorks />

      <p className="m-0 font-body text-[16px] leading-[1.9] text-ink-2">
        ستوديو الديوان مساحة عمل لقراءة الشعر العربي الكلاسيكي وتصميمه. تُفتح القصيدة
        للقراءة ببيتٍ واحدٍ في المرة، ثم تُحوَّل إلى لوحة جاهزة للنشر دون مغادرة الصفحة.
      </p>

      <dl className="mt-6 border-y border-rule font-ui text-[13px]">
        {FACTS.map(([term, value]) => (
          <div key={term} className="flex flex-wrap gap-x-4 gap-y-1 border-b border-rule py-2.5 last:border-b-0">
            <dt className="w-24 shrink-0 font-mono text-[10.5px] text-ink-3">{term}</dt>
            <dd className="m-0 min-w-0 flex-1 text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>

      <Footer />
    </div>
  );
}
