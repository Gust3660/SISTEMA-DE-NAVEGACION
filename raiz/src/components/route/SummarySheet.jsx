import { Bookmark, Clock3, Fuel, List, Navigation, Route, Zap } from 'lucide-react';
import { cx, softButtonClass } from '../ui/classes.js';

export default function SummarySheet({
  dragging,
  offset,
  onStartDrag,
  duration,
  distance,
  isElectricVehicle,
  estimatedBatteryLevel,
  fuelLiters,
  tollCost,
  riskScore,
  redZoneCount,
  trafficLevel,
  trafficSource,
  alertsCount,
  avoidedZoneCount,
  navigationActive,
  onStartNavigation,
  onOpenSteps,
  onSaveRoute,
  onOpenTollDetail
}) {
  return (
    <section
      className={cx(
        'fixed bottom-0 left-1/2 z-30 max-h-[78vh] w-[min(1010px,calc(100vw-140px))] -translate-x-1/2 overflow-auto rounded-t-[28px] border border-b-0 border-slate-200 bg-white/98 p-6 text-slate-950 shadow-uber backdrop-blur dark:border-slate-700 dark:bg-slate-950/98 dark:text-slate-50 max-[780px]:w-[calc(100vw-1rem)] max-[780px]:p-4',
        dragging ? 'select-none' : ''
      )}
      style={{ transform: `translate(-50%, ${-offset}px)` }}
    >
      <button
        type="button"
        className="mx-auto mb-5 block h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600"
        onPointerDown={onStartDrag}
        aria-label="Mover panel de resumen"
      />
      <h2 className="mb-5 text-2xl font-semibold">Resumen de la ruta</h2>
      <div className="grid grid-cols-4 gap-4 max-[820px]:grid-cols-2">
        <div className="grid gap-1"><Clock3 size={24} className="text-emerald-500 dark:text-yellow-400" /><strong>{Math.round(duration)} min</strong><small className="text-slate-500">Tiempo estimado</small></div>
        <div className="grid gap-1"><Route size={24} className="text-emerald-500 dark:text-yellow-400" /><strong>{distance.toFixed(1)} km</strong><small className="text-slate-500">Distancia</small></div>
        {isElectricVehicle ? (
          <div className="grid gap-1"><Zap size={24} className="text-emerald-500 dark:text-yellow-400" /><strong>{estimatedBatteryLevel.toFixed(0)}%</strong><small className="text-slate-500">Bateria al llegar</small></div>
        ) : (
          <div className="grid gap-1"><Fuel size={24} className="text-emerald-500 dark:text-yellow-400" /><strong>{fuelLiters.toFixed(2)} L</strong><small className="text-slate-500">Combustible estimado</small></div>
        )}
        <div className="grid gap-1"><Zap size={24} className="text-emerald-500 dark:text-yellow-400" /><strong>${Number(tollCost).toFixed(2)}</strong><small className="text-slate-500">Costo casetas</small></div>
      </div>

      <div className="mt-5 grid gap-2 rounded-3xl border border-slate-200 p-4 dark:border-slate-700">
        <p>Costo de casetas calculado automaticamente</p>
        <strong className="text-emerald-500">{Number(tollCost) > 0 ? `$${Number(tollCost).toFixed(2)} MXN` : 'Sin casetas'}</strong>
        <button type="button" className={softButtonClass} onClick={onOpenTollDetail}>Ver detalle</button>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          <p>Indice de riesgo de la ruta</p>
          <strong className="text-lg text-emerald-500">{riskScore}/100</strong>
        </div>
        <div className="my-4 grid grid-cols-6 gap-1.5"><i className="h-1.5 rounded-full bg-emerald-400" /><i className="h-1.5 rounded-full bg-emerald-400" /><i className="h-1.5 rounded-full bg-yellow-400" /><i className="h-1.5 rounded-full bg-orange-400" /><i className="h-1.5 rounded-full bg-red-400" /><i className="h-1.5 rounded-full bg-red-700" /></div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><b className="size-2.5 rounded-full bg-red-400" />Zonas rojas ({redZoneCount})</span>
          <span className="inline-flex items-center gap-1.5"><b className="size-2.5 rounded-full bg-orange-400" />Trafico {trafficLevel} ({trafficSource})</span>
          <span className="inline-flex items-center gap-1.5"><b className="size-2.5 rounded-full bg-yellow-400" />Obras (3)</span>
          <span className="inline-flex items-center gap-1.5"><b className="size-2.5 rounded-full bg-slate-400" />Accidentes ({alertsCount || 1})</span>
          <span className="inline-flex items-center gap-1.5"><b className="size-2.5 rounded-full bg-emerald-400" />Evitadas ({avoidedZoneCount})</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[2fr_1.2fr_1.2fr] gap-4 max-[760px]:grid-cols-1">
        <button type="button" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 font-black text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 dark:from-yellow-300 dark:to-yellow-400 dark:text-slate-950" onClick={onStartNavigation}>
          <Navigation size={24} />{navigationActive ? 'Detener navegacion' : 'Iniciar navegacion'}
        </button>
        <button type="button" className={softButtonClass} onClick={onOpenSteps}><List size={23} />Pasos</button>
        <button type="button" className={softButtonClass} onClick={onSaveRoute}><Bookmark size={22} />Guardar</button>
      </div>
    </section>
  );
}
