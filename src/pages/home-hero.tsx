import { Link } from 'react-router-dom';
import { SearchBox } from '../components/search-box';
import { HomeVerseCard } from './home-verse-card';

const TITLE = 'اقرأ بيتًا، ثم صمّمه.';

export function HomeHero() {
  return (
    <section className="container-page grid gap-12 py-14 md:grid-cols-12 md:items-start md:gap-12 md:py-20">
      <div className="md:col-span-7">
        <p className="eyebrow">الديوان · بيت من الشعر</p>
        <h1 className="mt-4 font-poem text-[clamp(40px,5vw,64px)] leading-[1.35] text-ink">
          {TITLE.split(' ').map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="rise-word inline-block"
              style={{ animationDelay: `${index * 18}ms` }}
            >
              {word}{' '}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-[46ch] text-[18px] leading-[1.8] text-ink-2">
          اكتشف الشعر العربي القديم من الديوان، ثم حوّل البيت إلى لوحة جاهزة للنشر.
        </p>
        <div className="mt-8">
          <SearchBox />
        </div>
        <nav aria-label="مداخل سريعة" className="font-ui mt-5 flex flex-wrap gap-6 text-sm text-ink-3">
          <Link to="/poems" className="underline-offset-[6px] hover:text-accent hover:underline">
            الفترات
          </Link>
          <Link to="/poems" className="underline-offset-[6px] hover:text-accent hover:underline">
            البحور
          </Link>
          <Link to="/poems" className="underline-offset-[6px] hover:text-accent hover:underline">
            القوافي
          </Link>
        </nav>
      </div>
      <div className="md:col-span-5">
        <HomeVerseCard />
      </div>
    </section>
  );
}
