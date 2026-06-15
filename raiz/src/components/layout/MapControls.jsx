import { Layers, LocateFixed, Minus, Plus } from 'lucide-react';
import { cx, iconButtonClass } from '../ui/classes.js';

export default function MapControls({ mapLayer, locatingOrigin, onToggleLayer, onLocateOrigin, onZoom }) {
  return (
    <div className="fixed right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
      <button
        type="button"
        className={cx(iconButtonClass, mapLayer === 'satellite' && 'bg-emerald-100 text-emerald-600 dark:bg-yellow-300 dark:text-slate-950')}
        onClick={onToggleLayer}
        aria-label="Cambiar capa del mapa"
      >
        <Layers size={25} />
      </button>
      <button type="button" className={cx(iconButtonClass, locatingOrigin && 'opacity-60')} aria-label="Usar mi ubicacion como punto de partida" onClick={onLocateOrigin} disabled={locatingOrigin}>
        <LocateFixed size={25} />
      </button>
      <button type="button" className={iconButtonClass} aria-label="Acercar" onClick={() => onZoom('in')}><Plus size={25} /></button>
      <button type="button" className={iconButtonClass} aria-label="Alejar" onClick={() => onZoom('out')}><Minus size={25} /></button>
    </div>
  );
}
