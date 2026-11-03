'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChefHat, Clock3, List, X } from 'lucide-react';
import { type Recipe } from '@/lib/recipes';
import {
  initialCooking,
  clockLabel,
  durationLabel,
  timerChoices,
  type CookingProgress,
} from '@/lib/cooking';
import { useCookingProgress } from './use-cooking-progress';
import { CookingSteps, IngredientRows, IngredientsPanel } from './recipe-interactions';

const cookingHash = '#matlaging';
const subscribeHydration = () => () => {};
const nowInSeconds = () => Math.floor(Date.now() / 1000);
function subscribeClock(refresh: () => void) {
  const interval = window.setInterval(refresh, 1000);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pageshow', refresh);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('pageshow', refresh);
  };
}
function RunningTimer({
  timer,
  stop,
}: {
  timer: NonNullable<CookingProgress['timer']>;
  stop: () => void;
}) {
  const now = useSyncExternalStore(subscribeClock, nowInSeconds, () => 0);
  const remaining = Math.max(0, timer.end - now);
  return (
    <div className="cook-timer">
      <div>
        <p>Nedteljing for steg {timer.step + 1}</p>
        <strong role="timer" aria-label="Tid att">
          {clockLabel(remaining)}
        </strong>
        <span role="status">{remaining === 0 ? 'Tida er ute.' : ''}</span>
      </div>
      <button type="button" className="text-link" onClick={stop}>
        {remaining ? 'Stopp nedteljinga' : 'Fjern nedteljinga'}
      </button>
    </div>
  );
}
function TimerChoice({ text, start }: { text: string; start: (seconds: number) => void }) {
  const choices = timerChoices(text);
  const [selected, setSelected] = useState(choices[0]);
  if (!choices.length) return null;
  return (
    <div className="cook-timer">
      {choices.length > 1 ? (
        <label>
          Vel tid
          <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
            {choices.map((n) => (
              <option key={n} value={n}>
                {durationLabel(n)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span>{durationLabel(choices[0])}</span>
      )}
      <button type="button" className="button secondary" onClick={() => start(selected)}>
        <Clock3 size={17} />
        Start nedteljing
      </button>
    </div>
  );
}
export function RecipeDirections({ recipe, children }: { recipe: Recipe; children: ReactNode }) {
  const steps = recipe.steps;
  const { progress, update, localOnlyInMemory } = useCookingProgress(recipe.id, steps.length);
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const current = progress.step ?? 0;
  const finished =
    steps.length > 0 && progress.done.length === steps.length && progress.step === null;
  useEffect(() => {
    if (
      progress.step !== null &&
      window.location.hash === cookingHash &&
      dialog.current &&
      !dialog.current.open
    )
      dialog.current.showModal();
  }, [progress.step]);
  function openMode(restart: boolean) {
    update((p) => {
      if (restart) return { ...initialCooking(), scale: p.scale, step: 0 };
      const first = steps.findIndex((_, i) => !p.done.includes(i));
      return { ...p, step: p.step ?? Math.max(0, first) };
    });
    setIngredientsOpen(false);
    window.history.replaceState(window.history.state, '', cookingHash);
    if (!dialog.current?.open) dialog.current?.showModal();
  }
  function closeMode() {
    if (window.location.hash === cookingHash)
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    setIngredientsOpen(false);
  }
  function toggle(index: number) {
    update((p) => {
      const done = p.done.includes(index) ? p.done.filter((i) => i !== index) : [...p.done, index];
      const next = steps.findIndex((_, i) => !done.includes(i));
      return { ...p, done, step: next === -1 ? null : next, timer: next === -1 ? null : p.timer };
    });
  }
  function move(forward: boolean) {
    const last = forward && current === steps.length - 1;
    update((p) => ({
      ...p,
      step: last ? null : current + (forward ? 1 : -1),
      done: forward ? [...new Set([...p.done, current])] : p.done,
      timer: last ? null : p.timer,
    }));
    setIngredientsOpen(false);
    if (body.current) body.current.scrollTop = 0;
    if (last) dialog.current?.close();
  }
  const resume = progress.step !== null;
  return (
    <>
      {steps.length > 0 && (
        <div className="cook-launch">
          <div>
            <p className="eyebrow">PÅ KJØKKENET</p>
            <p>{finished ? 'Matlaginga er fullført.' : 'Følg oppskrifta eitt steg om gongen.'}</p>
          </div>
          <div className="cook-launch-actions">
            <button
              type="button"
              className="button"
              disabled={!ready}
              onClick={() => openMode(finished)}
            >
              <ChefHat size={18} />
              {finished
                ? 'Start på nytt'
                : resume
                  ? 'Hald fram frå steg ' + (current + 1)
                  : 'Start matlaging'}
            </button>
            {resume && (
              <button type="button" className="text-link" onClick={() => openMode(true)}>
                Start på nytt
              </button>
            )}
          </div>
          {localOnlyInMemory && (
            <small role="status">
              Nettlesaren kan berre hugse framdrifta så lenge sida er open.
            </small>
          )}
        </div>
      )}
      <div className="detail-columns">
        <IngredientsPanel
          recipe={recipe}
          ready={ready}
          scale={progress.scale}
          setScale={(scale) => update((p) => ({ ...p, scale }))}
        />
        <section className="method">
          <p className="eyebrow">FRÅ RÅVARER TIL MÅLTID</p>
          <h2>Slik gjer du</h2>
          <p className="method-intro">
            Trykk på stegtala etter kvart som du blir ferdig. Tidsbruken er rettleiande.
          </p>
          <CookingSteps steps={steps} done={progress.done} toggle={toggle} ready={ready} />
          {children}
        </section>
      </div>
      <dialog
        ref={dialog}
        className="cooking-dialog"
        aria-labelledby="cook-title"
        onClose={closeMode}
      >
        <div className="cook-head">
          <div>
            <p className="eyebrow">MATLAGING</p>
            <h2 id="cook-title">{recipe.title}</h2>
          </div>
          <button
            type="button"
            className="cook-close"
            aria-label="Tilbake til oppskrifta"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        <div className="cook-body" ref={body}>
          <div className="cook-dots" aria-hidden="true">
            {steps.map((_, i) => (
              <i key={i} className={i <= current ? 'filled' : ''} />
            ))}
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h3>
              Steg {current + 1} av {steps.length}
            </h3>
            <p className="cook-instruction">{steps[current]}</p>
          </div>
          {progress.timer ? (
            <RunningTimer
              timer={progress.timer}
              stop={() => update((p) => ({ ...p, timer: null }))}
            />
          ) : (
            <TimerChoice
              key={current}
              text={steps[current] ?? ''}
              start={(seconds) =>
                update((p) => ({ ...p, timer: { step: current, end: nowInSeconds() + seconds } }))
              }
            />
          )}
          <button
            type="button"
            className="cook-ingredients-toggle"
            aria-expanded={ingredientsOpen}
            aria-controls="cook-ingredients"
            onClick={() => setIngredientsOpen((v) => !v)}
          >
            <List size={18} />
            {ingredientsOpen ? 'Skjul ingredienslista' : 'Vis ingredienslista'}
          </button>
          <div id="cook-ingredients" hidden={!ingredientsOpen}>
            <p className="eyebrow">TIL {(recipe.servings || 4) * progress.scale} PORSJONAR</p>
            <IngredientRows recipe={recipe} scale={progress.scale} />
          </div>
        </div>
        <div className="cook-nav">
          <button
            type="button"
            className="button secondary"
            disabled={current === 0}
            onClick={() => move(false)}
          >
            <ArrowLeft size={18} />
            Førre
          </button>
          <button type="button" className="button" onClick={() => move(true)}>
            {current === steps.length - 1 ? 'Fullfør' : 'Neste'}
            <ArrowRight size={18} />
          </button>
        </div>
      </dialog>
    </>
  );
}
