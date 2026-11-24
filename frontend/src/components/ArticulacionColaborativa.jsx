import { useState } from 'react';
import ListadoArticulacion from './articulacion/ListadoArticulacion';
import AsistenteProyecto from './articulacion/AsistenteProyecto';
import FichaProyecto from './articulacion/FichaProyecto';

// Contenedor del módulo de articulación: listado -> asistente de alta -> ficha del proyecto.
// Se usa como vista propia ("Articulación") y desde la pestaña de Secuencias.
export default function ArticulacionColaborativa() {
  const [pantalla, setPantalla] = useState({ tipo: 'lista' });
  const volver = () => {
    setPantalla({ tipo: 'lista' });
    window.scrollTo?.({ top: 0 });
  };

  if (pantalla.tipo === 'nuevo') {
    return <AsistenteProyecto onCancel={volver} onCreated={(id) => setPantalla({ tipo: 'ficha', id })} />;
  }
  if (pantalla.tipo === 'ficha') {
    return <FichaProyecto key={pantalla.id} id={pantalla.id} onBack={volver} />;
  }
  return <ListadoArticulacion onNuevo={() => setPantalla({ tipo: 'nuevo' })} onAbrir={(id) => setPantalla({ tipo: 'ficha', id })} />;
}
