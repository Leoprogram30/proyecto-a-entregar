import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { asArray, fuenteLabel, nuevoContenido, PRIORIDADES } from '../../config/catalogos';
import { Loading } from '../ui';
import { btnSecondary } from './helpers';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    sky: 'bg-sky-50 text-sky-800 border-sky-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-300'
  };
  return <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tones[tone]}`}>{children}</span>;
};

function SelectedItem({ item, index, catalogItem, readOnly, onChange, onRemove }) {
  const [draft, setDraft] = useState('');
  const delCatalogo = asArray(catalogItem?.indicadores);
  const propios = asArray(item.indicadores).filter((i) => !delCatalogo.includes(i));
  const universo = [...delCatalogo, ...propios];
  const marcados = asArray(item.indicadores);
  const toggleInd = (ind) =>
    onChange({ ...item, indicadores: marcados.includes(ind) ? marcados.filter((x) => x !== ind) : [...marcados, ind] });
  const addProp = () => {
    const t = draft.trim();
    if (!t) return;
    if (!marcados.includes(t)) onChange({ ...item, indicadores: [...marcados, t] });
    setDraft('');
  };
  return (
    <li className="rounded-xl border border-emerald-500 bg-emerald-50/50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-900 font-medium leading-relaxed">{item.texto}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {item.fuente && <Badge tone={item.fuente === 'diseno_2011_2015' ? 'amber' : 'sky'}>{fuenteLabel(item.fuente)}</Badge>}
            {catalogItem?.pagina && <Badge>{catalogItem.pagina}</Badge>}
            {!item.contenido_id && <Badge>Contenido propio</Badge>}
          </div>
          {item.meta && <p className="text-[11px] text-slate-500 mt-1 leading-snug">Meta: {item.meta}</p>}
        </div>
        <select
          aria-label={`Prioridad del contenido ${index + 1}`}
          disabled={readOnly}
          value={item.prioridad || 'esencial'}
          onChange={(e) => onChange({ ...item, prioridad: e.target.value })}
          className="p-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
        >
          {PRIORIDADES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {!readOnly && (
          <button type="button" onClick={onRemove} aria-label={`Quitar el contenido ${index + 1}`} className="text-slate-500 hover:text-rose-700">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="pl-1">
        <div className="text-[11px] font-bold text-slate-700 mb-1">Indicadores de logro ({marcados.length})</div>
        {universo.length === 0 && <p className="text-[11px] text-slate-500">Sin indicadores. Puede agregar los propios.</p>}
        <ul className="space-y-1">
          {universo.map((ind) => (
            <li key={ind}>
              <label className="flex items-start gap-2 text-[11px] text-slate-700 leading-snug">
                <input type="checkbox" disabled={readOnly} checked={marcados.includes(ind)} onChange={() => toggleInd(ind)} className="mt-0.5 text-emerald-600 rounded" />
                <span>{ind}</span>
              </label>
            </li>
          ))}
        </ul>
        {!readOnly && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              aria-label={`Agregar indicador propio al contenido ${index + 1}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProp())}
              placeholder="Indicador propio..."
              className="flex-1 p-1.5 text-[11px] border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="button" onClick={addProp} className={btnSecondary}>
              <Plus className="w-3 h-3" aria-hidden="true" /> Indicador
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function Grupo({ nombre, esMeta, items, abierto, onToggle, selectedIds, onPick }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        className="w-full flex items-start gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-left"
      >
        {abierto ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />}
        <span className="flex-1 text-xs font-semibold text-slate-800 leading-snug">
          {esMeta ? 'Meta: ' : 'Eje: '}
          {nombre}
        </span>
        <span className="text-[11px] text-slate-500 shrink-0">{items.length}</span>
      </button>
      {abierto && (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => {
            const on = selectedIds.has(it.id);
            return (
              <li key={it.id}>
                <label className={`flex items-start gap-2.5 p-2.5 text-xs cursor-pointer ${on ? 'bg-emerald-50/70' : 'hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={on} onChange={() => onPick(it)} className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500" />
                  <span className="flex-1 leading-relaxed text-slate-700">
                    {it.texto}
                    <span className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge tone={it.fuente === 'diseno_2011_2015' ? 'amber' : 'sky'}>{fuenteLabel(it.fuente)}</Badge>
                      {!it.vigente && <Badge tone="amber">Referencia</Badge>}
                      {it.pagina && <Badge>{it.pagina}</Badge>}
                      {it.indicadores.length > 0 && <Badge>{it.indicadores.length} indicadores</Badge>}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Metas, aprendizajes y contenidos e indicadores de logro, juntos.
 * value: [{texto, meta?, indicadores, fuente?, contenido_id?, prioridad}]
 */
export default function ContenidosPicker({ catalog, value, onChange, readOnly, error }) {
  const [q, setQ] = useState('');
  const [verRef, setVerRef] = useState(false);
  const [abiertos, setAbiertos] = useState({});
  const [draft, setDraft] = useState('');
  const list = asArray(value);

  const porId = useMemo(() => new Map(catalog.items.map((i) => [i.id, i])), [catalog.items]);
  const selectedIds = useMemo(() => new Set(list.map((c) => c.contenido_id).filter(Boolean)), [list]);

  const grupos = useMemo(() => {
    const nq = norm(q);
    const map = new Map();
    catalog.items.forEach((it) => {
      if (!it.vigente && !verRef) return;
      if (nq && !norm(`${it.texto} ${it.grupo} ${it.indicadores.join(' ')}`).includes(nq)) return;
      const key = `${it.vigente ? 'v' : 'r'}|${it.grupo}`;
      if (!map.has(key)) map.set(key, { key, nombre: it.grupo, esMeta: it.esMeta, vigente: it.vigente, items: [] });
      map.get(key).items.push(it);
    });
    return [...map.values()];
  }, [catalog.items, q, verRef]);

  const pick = (it) => {
    if (selectedIds.has(it.id)) {
      onChange(list.filter((c) => c.contenido_id !== it.id));
      return;
    }
    onChange([
      ...list,
      nuevoContenido(it.texto, { contenido_id: it.id, fuente: it.fuente, meta: it.meta, indicadores: [...it.indicadores] })
    ]);
  };

  const addPropio = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...list, nuevoContenido(t, { fuente: 'institucional' })]);
    setDraft('');
  };

  const vigentes = grupos.filter((g) => g.vigente);
  const refs = grupos.filter((g) => !g.vigente);
  const renderGrupos = (arr) =>
    arr.map((g) => (
      <Grupo
        key={g.key}
        nombre={g.nombre}
        esMeta={g.esMeta}
        items={g.items}
        abierto={q ? true : Boolean(abiertos[g.key])}
        onToggle={() => setAbiertos((a) => ({ ...a, [g.key]: !a[g.key] }))}
        selectedIds={selectedIds}
        onPick={pick}
      />
    ));

  return (
    <div className="space-y-5">
      <fieldset>
        <div className="flex items-center justify-between mb-2">
          <legend className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            Aprendizajes y contenidos seleccionados
          </legend>
          <span className="text-[11px] text-slate-500 font-medium">{list.length} seleccionados</span>
        </div>
        {list.length === 0 ? (
          <p className="text-xs text-slate-500 p-3 rounded-xl border border-dashed border-slate-300">
            Todavía no eligió contenidos. Búsquelos en el diseño curricular de abajo o agregue uno propio.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((c, i) => (
              <SelectedItem
                key={`${c.contenido_id || 'propio'}-${i}`}
                item={c}
                index={i}
                catalogItem={porId.get(c.contenido_id)}
                readOnly={readOnly}
                onChange={(next) => onChange(list.map((x, j) => (j === i ? next : x)))}
                onRemove={() => onChange(list.filter((_, j) => j !== i))}
              />
            ))}
          </ul>
        )}
        {error && <p className="mt-1 text-[11px] text-rose-700 font-medium">{error}</p>}
        {!readOnly && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              aria-label="Agregar otro contenido"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPropio())}
              placeholder="Agregar otro contenido propio (contextual)..."
              className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="button" onClick={addPropio} className={btnSecondary}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar
            </button>
          </div>
        )}
      </fieldset>

      {!readOnly && (
        <section aria-label="Diseño curricular del espacio" className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar en el diseño curricular"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por palabra en metas, contenidos o indicadores..."
                className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" role="switch" checked={verRef} onChange={(e) => setVerRef(e.target.checked)} className="rounded text-emerald-600" />
              Ver diseño 2011-2015 de referencia
            </label>
          </div>
          {catalog.loading && <Loading message="Cargando el diseño curricular..." />}
          {catalog.error && <p role="alert" className="text-xs text-rose-700">{catalog.error}</p>}
          {!catalog.loading && !catalog.error && catalog.items.length === 0 && (
            <p className="text-xs text-slate-500">Este espacio no tiene contenidos cargados en el catálogo. Use contenidos propios.</p>
          )}
          {!catalog.loading && catalog.items.length > 0 && grupos.length === 0 && (
            <p className="text-xs text-slate-500">Ningún contenido coincide con la búsqueda.</p>
          )}
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">{renderGrupos(vigentes)}</div>
          {refs.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-amber-800">Material de referencia: Diseño Curricular 2011-2015 (no vigente para planificar)</div>
              <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">{renderGrupos(refs)}</div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
