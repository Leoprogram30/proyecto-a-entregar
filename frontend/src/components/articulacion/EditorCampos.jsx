import { useState } from 'react';
import { VIGENCIAS, MODALIDADES, inputCls } from './constantes';
import { Campo } from './comunes';

// Formulario genérico para editar un subconjunto de campos del proyecto.
// campo: { k, label, tipo: 'text' | 'area' | 'lines' | 'modalidad' | 'vigencia' | 'date' | 'number', hint?, rows? }
export default function EditorCampos({ proyecto, campos, run, busy, onDone, titulo }) {
  const inicial = () =>
    Object.fromEntries(
      campos.map((c) => {
        const v = proyecto[c.k];
        return [c.k, c.tipo === 'lines' ? (v || []).join('\n') : v ?? ''];
      })
    );
  const [f, setF] = useState(inicial);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    const body = {};
    for (const c of campos) {
      if (c.tipo === 'lines') body[c.k] = String(f[c.k]).split('\n').map((x) => x.trim()).filter(Boolean);
      else if (c.tipo === 'number') body[c.k] = f[c.k] === '' ? 0 : Number(f[c.k]);
      else body[c.k] = f[c.k];
    }
    const r = await run('update', body, (x) => (x?.anulo_conformidades ? 'Guardado. Las conformidades se anularon: cada docente debe volver a conformar.' : 'Cambios guardados.'));
    if (r) onDone();
  };

  return (
    <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
      {titulo && <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>}
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map((c) => {
          const id = `ed-${c.k}`;
          const ancho = c.tipo === 'area' || c.tipo === 'lines' || c.k === 'titulo' ? 'sm:col-span-2' : '';
          return (
            <div key={c.k} className={ancho}>
              <Campo label={c.label} hint={c.hint} htmlFor={id}>
                {c.tipo === 'area' || c.tipo === 'lines' ? (
                  <textarea id={id} rows={c.rows || 3} required={c.requerido} value={f[c.k]} onChange={set(c.k)} className={inputCls} />
                ) : c.tipo === 'modalidad' ? (
                  <select id={id} value={f[c.k]} onChange={set(c.k)} className={inputCls}>
                    {Object.entries(MODALIDADES).map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </select>
                ) : c.tipo === 'vigencia' ? (
                  <select id={id} value={f[c.k]} onChange={set(c.k)} className={inputCls}>
                    {Object.entries(VIGENCIAS).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <input id={id} type={c.tipo === 'text' ? 'text' : c.tipo} min={c.tipo === 'number' ? 0 : undefined} required={c.requerido} value={f[c.k]} onChange={set(c.k)} className={inputCls} />
                )}
              </Campo>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onDone} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
        <button type="submit" disabled={busy} className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg disabled:opacity-50">Guardar</button>
      </div>
    </form>
  );
}
