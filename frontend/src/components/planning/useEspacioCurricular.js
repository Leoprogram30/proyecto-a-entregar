import { useMemo } from 'react';
import { api } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { asArray } from '../../config/catalogos';

/** Catálogo oficial de un espacio curricular, ya ordenado para la planificación. */
export function useEspacioCurricular(espacioId) {
  const { data, loading, error } = useAsync(
    async () => {
      if (!espacioId) return { rows: [] };
      const detail = await api.getEspacioDetail(espacioId, { todos: true });
      return { rows: asArray(detail?.contenidos) };
    },
    [espacioId],
    { rows: [] }
  );
  return useMemo(() => {
    const rows = data.rows;
    const items = rows
      .filter((r) => r.tipo !== 'objetivo')
      .map((r) => {
        const esPda = Boolean(r.meta);
        return {
          id: r.id,
          texto: esPda || !r.titulo || r.titulo === 'Progresiones de Aprendizaje' ? r.descripcion : `${r.titulo}: ${r.descripcion}`,
          grupo: esPda ? r.meta : r.titulo || 'Contenidos',
          esMeta: esPda,
          fuente: r.fuente,
          vigente: r.vigente,
          indicadores: asArray(r.indicadores),
          pagina: r.pagina,
          meta: esPda ? r.meta : undefined
        };
      });
    const objetivos = rows.filter((r) => r.tipo === 'objetivo');
    return { items, objetivos, loading, error, hayReferencia: items.some((i) => !i.vigente) || objetivos.some((o) => !o.vigente) };
  }, [data, loading, error]);
}
