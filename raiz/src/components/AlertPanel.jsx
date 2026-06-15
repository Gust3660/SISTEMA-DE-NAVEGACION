export default function AlertPanel({ alerts }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-300">Monitor</p>
          <h2 className="text-lg font-semibold text-white">Alertas</h2>
        </div>
        <span className="rounded-md bg-neutral-950 px-3 py-2 text-xs font-semibold uppercase text-neutral-300">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-neutral-400">Sin eventos criticos.</p>
      ) : (
        <div className="grid gap-3">
          {alerts.map((alert, index) => (
            <article key={`${alert.vehicle_id}-${alert.timestamp}-${index}`} className="rounded-md border border-white/10 bg-neutral-950 p-3">
              <p className="text-sm font-semibold text-rose-100">{alert.message}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                <span>{alert.vehicle_id}</span>
                <span>{alert.speed} km/h</span>
              </div>
              <p className="mt-2 text-xs text-neutral-300">{alert.lat.toFixed(5)}, {alert.lng.toFixed(5)}</p>
              <p className="mt-2 text-xs text-neutral-500">{new Date(alert.timestamp * 1000).toLocaleString()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
