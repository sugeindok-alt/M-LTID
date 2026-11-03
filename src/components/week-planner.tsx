'use client';
import { useState, useRef, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { Plus, Pencil, ShoppingBag, Check } from 'lucide-react';
import { api, ApiError } from '@/lib/client-api';
import type { WeekPlan } from '@/lib/week-planner';
import { dayNames, plusDays, dateLabel } from '@/lib/week-dates';

type Choice = { id: string; title: string };
const subscribe = () => () => {};
export function WeekPlanner({ initial, recipes }: { initial: WeekPlan; recipes: Choice[] }) {
  const [plan, setPlan] = useState(initial);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState<number | null>(null);
  const [recipeId, setRecipeId] = useState('');
  const [servings, setServings] = useState(4);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  function edit(day: number) {
    const dinner = plan.days.find((d) => d.day === day);
    setOpen(day);
    setRecipeId(dinner?.recipeId ?? '');
    setServings(dinner?.servings ?? 4);
    setError('');
    setMessage('');
  }
  async function action(run: () => Promise<WeekPlan>, success: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setPlan(await run());
      setOpen(null);
      setMessage(success);
      setStale(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fekk ikkje kontakt med tenesta. Prøv igjen.');
      if (e instanceof ApiError && e.status === 409) setStale(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function save(e: FormEvent) {
    e.preventDefault();
    if (open === null) return;
    void action(
      () => api('week', { week: plan.week, day: open, recipeId: recipeId || null, servings }),
      recipeId
        ? 'Middagen er lagra for ' + dayNames[open].toLowerCase() + '.'
        : dayNames[open] + ' står no tom.',
    );
  }
  return (
    <>
      <div className="week-layout">
        <section className="week-days" aria-label="Middagar denne veka">
          <p className="eyebrow week-count">{plan.days.length} AV 7 DAGAR PLANLAGDE</p>
          {dayNames.map((name, day) => {
            const dinner = plan.days.find((d) => d.day === day);
            return (
              <article key={name} className={'week-day' + (open === day ? ' editing' : '')}>
                <button
                  type="button"
                  className="week-row"
                  disabled={busy || !hydrated}
                  aria-expanded={open === day}
                  aria-describedby={'week-meal-' + day}
                  aria-label={
                    (dinner ? 'Endre middag for ' : 'Vel middag for ') + name.toLowerCase()
                  }
                  onClick={() => (open === day ? setOpen(null) : edit(day))}
                >
                  <span className="week-date">
                    <strong>{name}</strong>
                    <small>{dateLabel(plusDays(plan.week, day))}</small>
                  </span>
                  <span className="week-meal" id={'week-meal-' + day}>
                    {dinner ? (
                      <>
                        <strong>{dinner.title}</strong>
                        <small>
                          {dinner.servings} {dinner.servings === 1 ? 'porsjon' : 'porsjonar'}
                        </small>
                      </>
                    ) : (
                      <span className="week-empty">Ingen middag vald</span>
                    )}
                  </span>
                  {dinner ? <Pencil size={16} /> : <Plus size={17} />}
                </button>
                {open === day && (
                  <form onSubmit={save} className="week-editor">
                    <label>
                      Middag
                      <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                        <option value="">La dagen stå tom</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Porsjonar
                      <select
                        disabled={!recipeId}
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="week-editor-actions">
                      <button className="button" disabled={busy}>
                        {busy ? 'Lagrar …' : 'Lagre dagen'}
                      </button>
                      <button
                        className="text-link"
                        type="button"
                        disabled={busy}
                        onClick={() => setOpen(null)}
                      >
                        Avbryt
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </section>
        <aside className="week-basket">
          <p className="eyebrow">FRÅ VEKEPLAN TIL HANDLELISTE</p>
          <h2>{plan.imported ? 'Dette vart lagt til' : 'Dette blir lagt til'}</h2>
          {plan.items.length ? (
            <>
              <p>
                Samla mengd for middagane og porsjonane du har lagra. Mengdene kjem i tillegg til
                det som ligg i handlelista frå før.
              </p>
              <ul>
                {plan.items.map((item, i) => (
                  <li key={i}>
                    <span>{item.name}</span>
                    <strong>{item.measure}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Vel ein middag for å sjå råvarene her.</p>
          )}
          <button
            className="button week-import"
            disabled={
              !hydrated || busy || !plan.items.length || plan.imported || open !== null || stale
            }
            onClick={() =>
              action(
                () => api('week-shopping', { week: plan.week, version: plan.version }),
                'Varene er lagde i handlelista.',
              )
            }
          >
            {plan.imported ? <Check size={17} /> : <ShoppingBag size={17} />}
            {plan.imported ? 'Veka er lagd i handlelista' : 'Legg veka i handlelista'}
          </button>
          {open !== null && <small>Lagre eller avbryt endringa av dagen først.</small>}
          <Link href="/handleliste" className="text-link">
            Opne handlelista →
          </Link>
        </aside>
      </div>
      <div className="week-feedback" role="status">
        {message}
      </div>
      {error && (
        <div role="alert" className="form-message error week-feedback">
          {error}{' '}
          {stale && (
            <button
              className="text-link"
              disabled={busy}
              onClick={() => action(() => api('week?week=' + plan.week), 'Veka er oppdatert.')}
            >
              Hent veka på nytt
            </button>
          )}
        </div>
      )}
    </>
  );
}
