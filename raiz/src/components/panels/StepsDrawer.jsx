import { X } from 'lucide-react';
import { drawerClass, drawerCloseClass, drawerHeadClass } from '../ui/classes.js';

export default function StepsDrawer({ routeSteps, distance, duration, riskScore, onClose }) {
  return (
    <section className={drawerClass} aria-label="Pasos de la ruta">
      <div className={drawerHeadClass}>
        <button type="button" className={drawerCloseClass} onClick={onClose} aria-label="Cerrar pasos"><X size={20} /></button>
        <strong>Pasos de la ruta</strong>
      </div>
      <ol className="grid gap-3">
        {routeSteps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="grid grid-cols-[36px_1fr] gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-500 text-sm font-black text-white dark:bg-yellow-400 dark:text-slate-950">{index + 1}</span>
            <div>
              <strong className="block">{step.title}</strong>
              <small className="text-slate-500">{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950 p-3 text-center text-sm font-bold text-white dark:bg-yellow-300 dark:text-slate-950">
        <span>{distance.toFixed(1)} km</span>
        <span>{Math.round(duration)} min</span>
        <span>{riskScore}/100 riesgo</span>
      </div>
    </section>
  );
}
