import { X } from 'lucide-react';
import { formatCoord } from '../../utils/routeUtils.js';
import { drawerClass, drawerCloseClass, drawerHeadClass } from '../ui/classes.js';

export default function RouteListDrawer({
  title,
  ariaLabel,
  routes,
  ItemIcon,
  EmptyIcon,
  emptyTitle,
  emptyText,
  onClose,
  onLoad
}) {
  return (
    <section className={drawerClass} aria-label={ariaLabel}>
      <div className={drawerHeadClass}>
        <button type="button" className={drawerCloseClass} onClick={onClose} aria-label={`Cerrar ${title.toLowerCase()}`}><X size={20} /></button>
        <strong>{title}</strong>
      </div>

      {routes.length ? (
        <div className="grid gap-3">
          {routes.map((route) => (
            <button type="button" key={route.id} onClick={() => onLoad(route)}>
              <ItemIcon size={20} />
              <div>
                <strong>{route.name}</strong>
                <small>
                  {Number(route.distance).toFixed(1)} km · {Math.round(route.duration)} min · {route.vehicle}
                </small>
                <small>{formatCoord(route.origin.lat, route.origin.lng)} → {formatCoord(route.destination.lat, route.destination.lng)}</small>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center gap-2 rounded-3xl bg-slate-100 p-8 text-center text-slate-500 dark:bg-slate-900">
          <EmptyIcon size={28} />
          <strong>{emptyTitle}</strong>
          <p>{emptyText}</p>
        </div>
      )}
    </section>
  );
}
