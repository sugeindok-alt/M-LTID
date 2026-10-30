import Link from 'next/link';
import { ArrowRight, Leaf, MoveUpRight } from 'lucide-react';
import { novaNames, type NovaGroup, novaVerdict } from '@/lib/nova';
export function SectionHeading({
  kicker,
  title,
  href,
  link = 'Sjå alle oppskrifter',
}: {
  kicker: string;
  title: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {link}
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function SourceFailure({
  message = 'Vi fekk ikkje kontakt med oppskriftskjelda.',
  href = '/oppskrifter',
}: {
  message?: string;
  href?: string;
}) {
  return (
    <div className="empty-state">
      <Leaf size={30} />
      <h2>Ein liten pause på kjøkkenet.</h2>
      <p>{message} Vi viser oppskriftene når kjelda er tilgjengeleg igjen.</p>
      <a className="button secondary" href={href}>
        Prøv igjen <ArrowRight size={16} />
      </a>
    </div>
  );
}
export function NovaBadge({ group }: { group: NovaGroup }) {
  return (
    <span className={`nova-badge nova-${group || 'unknown'}`}>
      {group ? `NOVA ${group}` : 'NOVA ukjent'}
      <span>·</span>
      {novaVerdict(group)}
    </span>
  );
}
export function NovaEducation({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? 'nova-education compact' : 'nova-education'}>
      <div>
        <p className="eyebrow">LITT MEIR MATKUNNSKAP</p>
        <h2>
          Vit meir om
          <br />
          det du et.
        </h2>
        <p>
          Frå ei gulrot til ei ferdigrett. NOVA fortel om korleis maten er prosessert – ikkje heile
          historia om næring eller helse.
        </p>
        <Link href="/om-maten" className="text-link">
          Bli kjend med NOVA <MoveUpRight size={18} />
        </Link>
      </div>
      <div className="nova-scale">
        {([1, 2, 3, 4] as const).map((group) => (
          <div className="nova-row" key={group}>
            <span className={`nova-number nova-${group}`}>{group}</span>
            <div>
              <span className="eyebrow">NOVA {group}</span>
              <h3>{novaNames[group]}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
