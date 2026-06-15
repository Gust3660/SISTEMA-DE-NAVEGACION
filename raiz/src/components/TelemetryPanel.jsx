const fields = [
  { label: 'Vehiculo', name: 'vehicle_id', placeholder: 'VEH-001' },
  { label: 'Latitud', name: 'lat', placeholder: '19.42' },
  { label: 'Longitud', name: 'lng', placeholder: '-99.15' },
  { label: 'Velocidad km/h', name: 'speed', placeholder: '0' },
  { label: 'Combustible %', name: 'fuel_level', placeholder: '75' }
];

export default function TelemetryPanel({ telemetryForm, onChange, onSubmit, status }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-300">Flota</p>
          <h2 className="text-lg font-semibold text-white">Telemetria</h2>
        </div>
        <span className="rounded-md bg-neutral-950 px-3 py-2 text-xs font-semibold uppercase text-neutral-300">
          Live
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block text-xs font-medium text-neutral-300">
              {field.label}
              <input
                name={field.name}
                value={telemetryForm[field.name]}
                onChange={onChange}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
            </label>
          ))}
        </div>

        <button type="submit" className="rounded-md bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
          Enviar telemetria
        </button>
      </form>

      {status && (
        <div className={`mt-4 rounded-md border px-3 py-2 text-sm ${status.toLowerCase().includes('error') ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
