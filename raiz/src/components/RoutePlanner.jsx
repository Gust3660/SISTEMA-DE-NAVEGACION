import RideSummary from './RideSummary.jsx';

const fields = [
  ['origin_lat', 'Origen lat', '19.42'],
  ['origin_lng', 'Origen lng', '-99.15'],
  ['dest_lat', 'Destino lat', '19.45'],
  ['dest_lng', 'Destino lng', '-99.12'],
  ['vehicle_consumption', 'L/100 km', '8'],
  ['fuel_price_per_liter', 'MXN/L', '23.5'],
  ['toll_cost_mxn', 'Casetas MXN', '0']
];

export default function RoutePlanner({ routeForm, onChange, onSubmit, error, routeResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-300">Ruta</p>
          <h2 className="text-lg font-semibold text-white">Planificador</h2>
        </div>
        <span className="rounded-md bg-neutral-950 px-3 py-2 text-xs font-semibold uppercase text-neutral-300">
          Modelo local
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(([name, label, placeholder]) => (
            <label key={name} className="block text-xs font-medium text-neutral-300">
              {label}
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                name={name}
                value={routeForm[name]}
                onChange={onChange}
                placeholder={placeholder}
                type={name.includes('lat') || name.includes('lng') || name.includes('cost') || name.includes('price') || name.includes('consumption') ? 'number' : 'text'}
                step="0.01"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-2 text-sm text-neutral-300 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-neutral-950 px-3 py-2">
            <input type="checkbox" name="avoid_tolls" checked={routeForm.avoid_tolls} onChange={onChange} />
            Evitar peajes
          </label>
          <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-neutral-950 px-3 py-2">
            <input type="checkbox" name="avoid_highways" checked={routeForm.avoid_highways} onChange={onChange} />
            Evitar autopistas
          </label>
        </div>

        <button type="submit" className="rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-300">
          Calcular ruta
        </button>
      </form>

      {error && <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
      <RideSummary routeResult={routeResult} />
    </div>
  );
}
