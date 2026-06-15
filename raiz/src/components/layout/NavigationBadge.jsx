import { Navigation } from 'lucide-react';

export default function NavigationBadge({ duration }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-uber dark:bg-yellow-300 dark:text-slate-950">
      <Navigation size={18} />
      <span>Navegacion activa</span>
      <strong>{Math.round(duration)} min</strong>
    </div>
  );
}
