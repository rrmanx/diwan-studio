import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-rule pt-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-display text-[15px] text-ink">ستوديو الديوان — شعر يُقرأ ثم يُصمَّم</p>
          <p className="mt-1 font-ui text-[12px] text-ink-3">نصوص المعاينة من التراث العام.</p>
        </div>

        <nav aria-label="روابط التذييل" className="flex gap-5 font-ui text-[12.5px] text-ink-2">
          <Link to="/api" className="underline-offset-[6px] hover:text-accent hover:underline">
            التكامل
          </Link>
          <Link to="/about" className="underline-offset-[6px] hover:text-accent hover:underline">
            عن المشروع
          </Link>
          <a
            href="https://developers.aldiwan.net"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-[6px] hover:text-accent hover:underline"
          >
            الديوان API
          </a>
        </nav>
      </div>

      <p className="mt-5 font-mono text-[10px] text-ink-3">v1.0 · صُنع بواسطة rrmanx</p>
    </footer>
  );
}
