import { ChevronDown, ChevronUp, Layers, LocateFixed, MoveRight, Navigation, X } from 'lucide-react';
import { cx } from '../ui/classes.js';
import { formatInstructionDistance } from '../../utils/navigationUtils.js';

export default function NavigationHud({
  maneuver,
  arrivalTime,
  remainingMinutes,
  remainingKm,
  speedKmh,
  simulated,
  detailsOpen,
  totalDistanceKm,
  tollCost,
  riskScore,
  mapLayer,
  onToggleLayer,
  onRecenter,
  onZoom,
  onToggleDetails,
  onStop
}) {
  const TurnIcon = maneuver?.type === 'left' ? TurnLeftIcon : maneuver?.type === 'right' ? TurnRightIcon : MoveRight;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="absolute left-3 top-3 w-[min(520px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl bg-emerald-700 text-white shadow-2xl ring-1 ring-white/15 dark:bg-emerald-800">
        <div className="flex items-start gap-4">
          <TurnIcon className="ml-5 mt-5 size-16 shrink-0 text-white" strokeWidth={3.4} />
          <div className="min-w-0">
            <strong className="mt-6 block text-4xl leading-tight max-[560px]:text-3xl">{maneuver?.label || 'Continua'}</strong>
            <b className="mb-5 block truncate text-lg text-white/90">
              {formatInstructionDistance(maneuver?.distance ?? 0)} · {maneuver?.detail || 'Sigue sobre la ruta marcada'}
            </b>
          </div>
        </div>
        <div className="flex w-fit items-center gap-3 rounded-tr-3xl bg-emerald-800 px-6 py-4 text-white dark:bg-emerald-900">
          <span className="text-2xl">Luego</span>
          <ArrowLane active={maneuver?.type === 'straight'} />
          <ArrowLane active={maneuver?.type === 'left'} direction="left" />
          <ArrowLane active={maneuver?.type === 'right'} direction="right" />
        </div>
      </div>

      <div className="absolute right-4 top-4 grid gap-3">
        <div className="grid size-20 place-items-center rounded-full border-4 border-red-600 bg-white text-slate-950 shadow-xl dark:border-yellow-300 dark:bg-slate-950 dark:text-yellow-300">
          <strong className="text-3xl leading-none">{Math.round(speedKmh || 0)}</strong>
          <span className="-mt-2 text-xs font-bold text-slate-950 dark:text-yellow-200">km/h</span>
        </div>
        <div className="grid size-16 place-items-center rounded-full bg-white text-slate-950 shadow-xl ring-1 ring-slate-200 transition dark:bg-slate-950 dark:text-white dark:ring-slate-800">
          <Navigation className="size-8 rotate-45 text-red-500 dark:text-red-500" fill="currentColor" />
        </div>
        <button
          type="button"
          className="pointer-events-auto grid size-16 place-items-center rounded-full bg-white text-slate-950 shadow-xl ring-1 ring-slate-200 transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:bg-slate-950 dark:text-white dark:ring-slate-800 dark:hover:bg-slate-900 dark:active:bg-yellow-300 dark:active:text-slate-950"
          onClick={onToggleLayer}
          aria-label={mapLayer === 'satellite' ? 'Cambiar a mapa estandar' : 'Cambiar a satelite'}
          title={mapLayer === 'satellite' ? 'Mapa' : 'Satelite'}
        >
          <Layers className="size-8" />
        </button>
        <div className="flex h-36 w-16 flex-col items-center justify-between rounded-full border border-white bg-white py-4 text-slate-800 shadow-[0_18px_46px_rgba(15,23,42,0.32)] ring-1 ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:ring-slate-800 max-[680px]:h-40 max-[680px]:w-[4.5rem]">
          <button type="button" className="pointer-events-auto grid size-11 place-items-center rounded-full text-4xl font-light leading-none transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:hover:bg-slate-900 dark:active:bg-yellow-300 dark:active:text-slate-950 max-[680px]:size-12" aria-label="Acercar mapa" onClick={() => onZoom?.('in')}>+</button>
          <button type="button" className="pointer-events-auto grid size-11 place-items-center rounded-full text-4xl font-light leading-none transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:hover:bg-slate-900 dark:active:bg-yellow-300 dark:active:text-slate-950 max-[680px]:size-12" aria-label="Alejar mapa" onClick={() => onZoom?.('out')}>−</button>
        </div>
      </div>

      <button
        type="button"
        className="pointer-events-auto absolute bottom-28 left-7 inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-6 text-lg font-black text-emerald-700 shadow-2xl ring-1 ring-slate-200 transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:bg-slate-950 dark:text-yellow-300 dark:ring-slate-800 dark:hover:bg-slate-900 dark:active:bg-yellow-300 dark:active:text-slate-950 max-[680px]:bottom-44"
        onClick={onRecenter}
      >
        <LocateFixed className="size-7" /> Centrar
      </button>

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[28px] bg-white text-slate-950 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-800">
        {detailsOpen && (
          <div className="grid grid-cols-4 gap-3 border-b border-slate-200 px-6 py-4 text-center dark:border-slate-800 max-[760px]:grid-cols-2">
            <Detail value={`${Number(totalDistanceKm || 0).toFixed(1)} km`} label="Ruta total" />
            <Detail value={`$${Number(tollCost || 0).toFixed(0)}`} label="Casetas" />
            <Detail value={`${riskScore || 0}/100`} label="Riesgo" />
            <Detail value={simulated ? 'Demo' : 'GPS'} label="Modo" />
          </div>
        )}
        <div className="flex items-center">
          <button type="button" className="pointer-events-auto m-5 grid size-16 shrink-0 place-items-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-yellow-300 dark:active:text-slate-950" onClick={onStop} aria-label="Detener navegacion">
            <X size={24} />
          </button>
          <div className="grid flex-1 grid-cols-3 items-center text-center">
            <Metric value={arrivalTime} label="Llegada" />
            <Metric value={Math.max(1, Math.round(remainingMinutes))} label="min" />
            <Metric value={remainingKm.toFixed(1)} label="km" />
          </div>
          <button
            type="button"
            className="pointer-events-auto mx-5 grid size-12 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 active:bg-emerald-500 active:text-white dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-yellow-300 dark:active:text-slate-950"
            onClick={onToggleDetails}
            aria-label={detailsOpen ? 'Ocultar detalles de navegacion' : 'Mostrar detalles de navegacion'}
          >
            {detailsOpen ? <ChevronDown size={30} /> : <ChevronUp size={30} />}
          </button>
        </div>
      </div>

      <div className={cx(
        'absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold shadow-lg max-[680px]:bottom-36',
        simulated ? 'bg-yellow-300 text-slate-950' : 'bg-emerald-500 text-white'
      )}>
        {simulated ? 'Vista demo sobre la ruta' : `${Math.round(speedKmh || 0)} km/h`}
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="py-5">
      <strong className="block text-3xl font-black leading-tight text-emerald-600 dark:text-yellow-300">{value}</strong>
      <span className="block text-base text-slate-500 dark:text-slate-300">{label}</span>
    </div>
  );
}

function Detail({ value, label }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-900">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

function ArrowLane({ active, direction = 'straight' }) {
  return (
    <span className={cx('text-3xl font-black leading-none', active ? 'text-white' : 'text-white/45')}>
      {direction === 'left' ? '↰' : direction === 'right' ? '↱' : '↑'}
    </span>
  );
}

function TurnRightIcon(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 54V28a12 12 0 0 1 12-12h21" />
      <path d="M42 7l10 9-10 9" />
    </svg>
  );
}

function TurnLeftIcon(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M46 54V28a12 12 0 0 0-12-12H13" />
      <path d="M22 7l-10 9 10 9" />
    </svg>
  );
}
