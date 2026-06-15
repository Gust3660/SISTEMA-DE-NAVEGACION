import { X } from 'lucide-react';
import { cx, drawerClass, drawerCloseClass, drawerHeadClass, inputClass, labelTextClass, panelCardClass } from '../ui/classes.js';

export default function RouteOptionsDrawer({
  routeForm,
  tollCost,
  routeResult,
  isElectricVehicle,
  onClose,
  onUpdateRouteOption
}) {
  return (
    <section className={drawerClass} aria-label="Opciones de ruta">
      <div className={drawerHeadClass}>
        <button type="button" className={drawerCloseClass} onClick={onClose} aria-label="Cerrar opciones de ruta"><X size={20} /></button>
        <strong>Opciones de ruta</strong>
      </div>

      <div className="grid gap-4">
        <label className={cx(panelCardClass, 'grid gap-3')}>
          <div>
            <strong className="block">Evitar peajes</strong>
            <small className="text-slate-500">La ruta no sumara casetas y preferira caminos libres.</small>
          </div>
          <input className="sr-only" type="checkbox" checked={routeForm.avoid_tolls} onChange={(event) => onUpdateRouteOption('avoid_tolls', event.target.checked)} />
          <span className={cx('flex h-10 w-24 items-center rounded-full p-1 text-sm font-black text-white transition', routeForm.avoid_tolls ? 'justify-start bg-emerald-500' : 'justify-end bg-red-500')} aria-hidden="true">
            <b className="px-2">{routeForm.avoid_tolls ? 'ON' : 'OFF'}</b>
            <i className="size-8 rounded-full bg-white shadow" />
          </span>
        </label>

        <label className={cx(panelCardClass, 'grid gap-3')}>
          <div>
            <strong className="block">Evitar autopistas</strong>
            <small className="text-slate-500">Calcula una ruta mas urbana y menos dependiente de vias rapidas.</small>
          </div>
          <input className="sr-only" type="checkbox" checked={routeForm.avoid_highways} onChange={(event) => onUpdateRouteOption('avoid_highways', event.target.checked)} />
          <span className={cx('flex h-10 w-24 items-center rounded-full p-1 text-sm font-black text-white transition', routeForm.avoid_highways ? 'justify-start bg-emerald-500' : 'justify-end bg-red-500')} aria-hidden="true">
            <b className="px-2">{routeForm.avoid_highways ? 'ON' : 'OFF'}</b>
            <i className="size-8 rounded-full bg-white shadow" />
          </span>
        </label>

        {!routeForm.avoid_tolls && (
          <div className={panelCardClass}>
            <span className={labelTextClass}>Costo de peajes automatico</span>
            <strong className="block text-xl text-emerald-500">${Number(tollCost).toFixed(2)}</strong>
            <small className="text-slate-500">
              {routeResult?.toll_corridors?.length
                ? routeResult.toll_corridors.join(', ')
                : 'Sin casetas detectadas en esta ruta'}
            </small>
          </div>
        )}

        {!isElectricVehicle && (
          <label className="grid gap-2">
            <span className={labelTextClass}>Precio combustible</span>
            <input className={inputClass} type="number" min="0" step="0.1" value={routeForm.fuel_price_per_liter} onChange={(event) => onUpdateRouteOption('fuel_price_per_liter', event.target.value)} />
            <small className="text-slate-500">MXN/L</small>
          </label>
        )}
      </div>
    </section>
  );
}
