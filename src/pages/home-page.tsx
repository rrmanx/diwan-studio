import { Link } from 'react-router-dom';
import { useTopbar } from '../components/app-shell';
import { VocabRails } from '../components/vocab-rails';
import { HomePoets } from './home-poets';
import { HomeQuote } from './home-quote';
import { HomeSelected } from './home-selected';
import { HomeVerseCard } from './home-verse-card';

export function HomePage() {
  const topbarActions = useTopbar(
    'اكتشف',
    <Link
      to="/quotes"
      className="font-ui text-[12.5px] text-ink-2 underline-offset-[6px] transition-colors duration-150 hover:text-accent hover:underline"
    >
      الاقتباسات
    </Link>,
  );

  return (
    <>
      {topbarActions}
      <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 min-[960px]:grid-cols-12">
        <div className="min-[960px]:col-span-7">
          <HomeVerseCard />
        </div>
        <div className="min-[960px]:col-span-5">
          <HomeQuote />
        </div>
      </div>

      <VocabRails hint="مداخل التصفّح" />

      <div className="grid grid-cols-1 gap-4 min-[960px]:grid-cols-12">
        <div className="min-[960px]:col-span-5">
          <HomePoets />
        </div>
        <div className="min-[960px]:col-span-7">
          <HomeSelected />
        </div>
        </div>
      </div>
    </>
  );
}
