export default function RideSummary({ routeResult }) {
  if (!routeResult) return null;

  const items = [
    ['Distancia', `${routeResult.distance_km} km`],
    ['Duracion', `${routeResult.duration_minutes} min`],
    ['Total', `$ ${routeResult.total_cost_mxn}`],
    ['Combustible', `${routeResult.fuel_consumption_liters} L`],
    ['Manhattan', `${routeResult.manhattan_distance_km} km`],
    ['Waypoints', routeResult.waypoints?.length || 0]
  ];

  return (
    <div className="mt-4 rounded-md border border-white/10 bg-neutral-950 p-3">
      <div className="grid grid-cols-2 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white/5 p-3">
            <p className="text-xs text-neutral-400">{label}</p>
            <strong className="mt-1 block text-sm text-white">{value}</strong>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-400">{routeResult.summary}</p>
    </div>
  );
}
