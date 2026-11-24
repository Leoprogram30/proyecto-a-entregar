/* oxlint-disable react/only-export-components */
import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { useToast, Loading, ErrorState } from './ui';
import { Campo } from './UsuariosTab';

const INPUT = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white';
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1, ANIO_ACTUAL + 2];
export const RUTA_LABEL = { ruta_1: 'Ruta 1', ruta_2: 'Ruta 2 (institución precursora)' };

function FilaAnio({ anio, actual, onSaved }) {
  const toast = useToast();
  const [ruta, setRuta] = useState(actual?.ruta ?? 'ruta_1');
  const [obs, setObs] = useState(actual?.observaciones ?? '');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.saveRuta({ anio_lectivo: anio, ruta, observaciones: obs.trim() || null });
      toast.success(`Ruta del ciclo lectivo ${anio} guardada.`);
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} aria-label={`Ruta del ciclo lectivo ${anio}`} className="bg-white rounded-2xl border border-slate-200 p-4 grid gap-3 sm:grid-cols-[6rem_1fr_2fr_auto] items-end">
      <div className="text-lg font-extrabold text-slate-900">{anio}</div>
      <Campo id={`ruta-${anio}`} label="Ruta">
        <select id={`ruta-${anio}`} value={ruta} onChange={(e) => setRuta(e.target.value)} className={INPUT}>
          {Object.entries(RUTA_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`obs-${anio}`} label="Observaciones">
        <input id={`obs-${anio}`} type="text" maxLength={2000} value={obs} onChange={(e) => setObs(e.target.value)} className={INPUT} />
      </Campo>
      <button type="submit" disabled={guardando} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold">
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

export default function InstitucionTab() {
  const { data, loading, error, reload } = useAsync(() => api.getRutas(), []);
  if (loading) return <Loading message="Cargando configuración institucional..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <section className="space-y-4" aria-label="Configuración institucional">
      <p className="text-xs text-slate-600 max-w-3xl">
        Defina la ruta de TransFORMAR@Cba de cada ciclo lectivo. Si es Ruta 2, la escuela es institución precursora y se habilita el seguimiento de las líneas
        de la Res. SE 88/2025 (referencia: normativa 2026; verificar la que se dicte para 2027).
      </p>
      {ANIOS.map((a) => {
        const actual = data.find((r) => r.anio_lectivo === a);
        return <FilaAnio key={`${a}-${actual?.ruta}-${actual?.observaciones}`} anio={a} actual={actual} onSaved={reload} />;
      })}
    </section>
  );
}
