import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { privatePage } from '@/lib/private-page';
import { catalog } from '@/lib/catalog';
import { readWeek } from '@/lib/week-planner';
import { thisWeek, isWeek, dateLabel, plusDays } from '@/lib/week-dates';
import { PrivateNavigation } from '@/components/private-navigation';
import { WeekPlanner } from '@/components/week-planner';
import './week.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi veke', robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ veke?: string }> }) {
  const { veke } = await searchParams;
  const week = veke === undefined ? thisWeek() : veke;
  if (!isWeek(week)) notFound();
  const user = await privatePage(veke ? '/mi-veke?veke=' + week : '/mi-veke');
  const [plan, recipes] = await Promise.all([
    readWeek(getDb(), user.id, week),
    catalog.browse({ sort: 'az' }),
  ]);
  return (
    <div className="container page-shell private-layout week-page">
      <header className="page-intro">
        <p className="eyebrow">MIDDAG DAG FOR DAG</p>
        <h1>Mi veke.</h1>
        <p>
          Vel middagar og porsjonar, og ta med råvarene til handlelista. Du kan la dagar stå opne.
        </p>
      </header>
      <PrivateNavigation current="/mi-veke" />
      <nav className="week-switcher" aria-label="Vel veke">
        <Link
          className="week-arrow"
          prefetch={false}
          href={'/mi-veke?veke=' + plusDays(week, -7)}
          aria-label="Førre veke"
        >
          <ChevronLeft size={19} />
        </Link>
        <h2>
          {dateLabel(week)} – {dateLabel(plusDays(week, 6))} {plusDays(week, 6).slice(0, 4)}
        </h2>
        <Link
          className="week-arrow"
          prefetch={false}
          href={'/mi-veke?veke=' + plusDays(week, 7)}
          aria-label="Neste veke"
        >
          <ChevronRight size={19} />
        </Link>
      </nav>
      <WeekPlanner
        key={week}
        initial={plan}
        recipes={recipes.map(({ id, title }) => ({ id, title }))}
      />
    </div>
  );
}
