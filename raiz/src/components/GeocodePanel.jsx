export default function GeocodePanel({ geoQuery, onQueryChange, onSubmit, geoResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-300">Ubicacion</p>
          <h2 className="text-lg font-semibold text-white">Catalogo local</h2>
        </div>
        <span className="rounded-md bg-neutral-950 px-3 py-2 text-xs font-semibold uppercase text-neutral-300">
          Offline
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="block text-xs font-medium text-neutral-300">
          Lugar o coordenadas
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            value={geoQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Zocalo o 19.43,-99.13"
          />
        </label>
        <button type="submit" className="rounded-md bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
          Buscar coordenadas
        </button>
      </form>

      {geoResult && (
        <div className="mt-4 rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-neutral-100">
          <p className="font-semibold text-white">{geoResult.display_name}</p>
          <p className="mt-1 text-neutral-400">{geoResult.lat}, {geoResult.lng}</p>
        </div>
      )}
    </div>
  );
}
