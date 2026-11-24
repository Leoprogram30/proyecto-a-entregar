import { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

import { btnSecondary, fieldCls } from './helpers';

export function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-[11px] text-slate-500 mb-1 leading-snug">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-[11px] text-rose-700 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ id, label, value, onChange, rows = 4, placeholder, error, hint, disabled }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${fieldCls(error)} leading-relaxed`}
      />
    </Field>
  );
}

/** Casillas para elegir de un catálogo cerrado. */
export function CheckGroup({ legend, options, value, onChange, disabled, error, columns = 'sm:grid-cols-2' }) {
  const list = Array.isArray(value) ? value : [];
  const toggle = (opt) => onChange(list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt]);
  return (
    <fieldset>
      <legend className="text-xs font-bold text-slate-800 mb-2">{legend}</legend>
      <div className={`grid grid-cols-1 ${columns} gap-2`}>
        {options.map((opt) => {
          const on = list.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition ${disabled ? '' : 'cursor-pointer'} ${
                on ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 font-medium' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={disabled}
                onChange={() => toggle(opt)}
                className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="leading-relaxed">{opt}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[11px] text-rose-700 font-medium">{error}</p>}
    </fieldset>
  );
}

/** Lista de textos con alta y baja (objetivos, metas propias...). */
export function StringListEditor({ legend, items, onChange, disabled, addLabel, placeholder, error, suggestions = [] }) {
  const [draft, setDraft] = useState('');
  const list = Array.isArray(items) ? items : [];
  const add = (text) => {
    const t = String(text ?? draft).trim();
    if (!t) return;
    if (!list.includes(t)) onChange([...list, t]);
    setDraft('');
  };
  const sugg = suggestions.filter((s) => !list.includes(s));
  return (
    <fieldset>
      <div className="flex items-center justify-between mb-2">
        <legend className="text-xs font-bold text-slate-800">{legend}</legend>
        <span className="text-[11px] text-slate-500 font-medium">{list.length} en la planificación</span>
      </div>
      {sugg.length > 0 && !disabled && (
        <div className="mb-2">
          <div className="text-[11px] font-semibold text-slate-500 mb-1">Del diseño curricular (clic para agregar)</div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {sugg.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="w-full text-left p-2 text-xs rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-600 leading-relaxed"
              >
                <Plus className="w-3 h-3 inline mr-1 text-emerald-600" aria-hidden="true" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {list.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {list.map((t, i) => (
            <li key={`${i}-${t}`} className="flex items-start gap-2 p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/70 text-xs text-slate-900">
              <span className="flex-1 leading-relaxed">{t}</span>
              {!disabled && (
                <button type="button" aria-label={`Quitar: ${t.slice(0, 40)}`} onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-700">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mb-1 text-[11px] text-rose-700 font-medium">{error}</p>}
      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label={addLabel}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={placeholder}
            className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button type="button" onClick={() => add()} className={btnSecondary}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar
          </button>
        </div>
      )}
    </fieldset>
  );
}

/** Botones para subir, bajar y quitar un elemento de una lista ordenada. */
export function RowControls({ index, total, onMove, onRemove, label, disabled }) {
  if (disabled) return null;
  const b = 'p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30';
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={b} disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`Subir ${label}`}>
        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button type="button" className={b} disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label={`Bajar ${label}`}>
        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button type="button" className={`${b} hover:text-rose-700`} onClick={() => onRemove(index)} aria-label={`Quitar ${label}`}>
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
