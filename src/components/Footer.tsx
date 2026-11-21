import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container-page grid grid-cols-1 gap-6 py-8 text-sm text-ink-2 sm:grid-cols-3">
        <p className="font-display text-base text-ink">ستوديو الديوان — شعر يُقرأ ثم يُصمَّم</p>

        <nav aria-label="روابط التذييل" className="flex gap-5">
          <Link to="/api" className="hover:text-ink">
            التكامل
          </Link>
          <Link to="/about" className="hover:text-ink">
            عن المشروع
          </Link>
        </nav>

        <div className="space-y-1 text-ink-3">
          <p>
            <a
              href="https://developers.aldiwan.net"
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent"
            >
              البيانات من الديوان API
            </a>
          </p>
          <p>نصوص المعاينة من التراث العام</p>
        </div>
      </div>
    </footer>
  );
}
