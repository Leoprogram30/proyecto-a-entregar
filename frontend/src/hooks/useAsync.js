import { useEffect, useState } from 'react';

// Ejecuta fn() cuando cambian las dependencias (deps: lista de valores simples) o se llama reload().
// Descarta respuestas viejas: solo cuenta la de la última combinación de deps.
export function useAsync(fn, deps, initial = null) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, data: initial, error: '' });
  const key = JSON.stringify([...deps, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setResult({ key, data, error: '' }))
      .catch((e) => !cancelled && setResult({ key, data: initial, error: e.message }));
    return () => {
      cancelled = true;
    };
    // fn e initial se toman de la render que cambió la clave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result.key !== key;
  return {
    data: loading ? initial : result.data ?? initial,
    error: loading ? '' : result.error,
    loading,
    reload: () => setReloadKey((k) => k + 1)
  };
}
