'use client';
import { useState, type FormEvent } from 'react';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/client-api';
import { formatMeasure } from '@/lib/quantities';
import { useToast } from './providers';
export type ShoppingItem = {
  id: string;
  name: string;
  measure: string;
  amount: number | null;
  unit: string | null;
  purchased: boolean;
};
export function ShoppingList({ initial }: { initial: ShoppingItem[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const notify = useToast();
  async function refresh() {
    setItems((await api<{ items: ShoppingItem[] }>('shopping')).items);
  }
  async function mutate(data: unknown, method: string) {
    setBusy(true);
    try {
      await api('shopping', data, method);
      await refresh();
      return true;
    } catch (error) {
      notify((error as Error).message, true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (
      await mutate({ requestId, name: fields.get('name'), measure: fields.get('measure') }, 'POST')
    ) {
      form.reset();
      setRequestId(crypto.randomUUID());
    }
  }
  return (
    <>
      <form className="shopping-form" onSubmit={add}>
        <label>
          Legg til ei vare
          <input name="name" placeholder="Til dømes tomatar" maxLength={100} required />
        </label>
        <label>
          Mengd
          <input name="measure" placeholder="2 kg" maxLength={80} />
        </label>
        <button className="button" disabled={busy}>
          <Plus size={16} />
          Legg til
        </button>
      </form>
      <div className="results-heading">
        <p>{items.filter((i) => !i.purchased).length} varer att</p>
        <button
          className="text-link"
          disabled={busy || !items.some((i) => i.purchased)}
          onClick={() => mutate({ purchased: true }, 'DELETE')}
        >
          Fjern kjøpte varer <Trash2 size={14} />
        </button>
      </div>
      {items.length ? (
        <div className="shopping-list" style={{ marginTop: 20 }}>
          {items.map((item) => (
            <div className={`shopping-row ${item.purchased ? 'purchased' : ''}`} key={item.id}>
              <input
                type="checkbox"
                checked={item.purchased}
                disabled={busy}
                aria-label={`Kjøpt ${item.name}`}
                onChange={(e) => mutate({ id: item.id, purchased: e.target.checked }, 'PATCH')}
              />
              <span className="item-name">{item.name}</span>
              <QuantityEditor
                item={item}
                disabled={busy}
                onSave={(measure) => mutate({ id: item.id, measure }, 'PATCH')}
              />
              <button
                className="icon-button"
                aria-label={`Fjern ${item.name}`}
                disabled={busy}
                onClick={() => mutate({ id: item.id }, 'DELETE')}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={30} />
          <h2>Klar for neste handletur.</h2>
          <p>Legg til varer her, eller hent ingrediensar rett frå ei oppskrift.</p>
        </div>
      )}
      <p className="source-note" style={{ marginTop: 24 }}>
        Berre reine tal med same eining blir slått saman automatisk. Frie tekstmengder og redigerte
        varer blir haldne kvar for seg.
      </p>
    </>
  );
}
function QuantityEditor({
  item,
  disabled,
  onSave,
}: {
  item: ShoppingItem;
  disabled: boolean;
  onSave: (measure: string) => Promise<boolean>;
}) {
  const current = item.amount !== null ? formatMeasure(item.amount, item.unit || '') : item.measure;
  const [value, setValue] = useState(current);
  return (
    <form
      className="quantity-edit"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(value);
      }}
    >
      <input
        aria-label={`Mengd for ${item.name}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={80}
      />
      <button disabled={disabled || value === current} type="submit">
        Lagre
      </button>
    </form>
  );
}
