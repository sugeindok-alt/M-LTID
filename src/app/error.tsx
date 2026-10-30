'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-shell empty-state">
      <p className="eyebrow">EIN LITEN PAUSE</p>
      <h1>Noko gjekk gale.</h1>
      <p>Vi klarte ikkje å hente innhaldet akkurat no.</p>
      <button className="button" onClick={reset}>
        Prøv igjen
      </button>
    </div>
  );
}
