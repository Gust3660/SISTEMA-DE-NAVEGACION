import { Search, X } from 'lucide-react';

export default function SearchPanel({
  query,
  searching,
  suggestions,
  frequentPlaces,
  onQueryChange,
  onSubmit,
  onClose,
  onSelectDestination
}) {
  return (
    <section className="fixed right-4 top-4 z-30 max-h-[calc(100vh-2rem)] w-[min(420px,calc(100vw-2rem))] overflow-auto rounded-[28px] border border-slate-200/80 bg-white/95 p-5 text-slate-950 shadow-uber backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/95 dark:text-slate-50" aria-label="Buscar destino">
      <div className="mb-4 flex items-center gap-3">
        <button type="button" className="grid size-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" onClick={onClose} aria-label="Cerrar busqueda"><X size={20} /></button>
        <strong>Buscar destino</strong>
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
          <Search size={22} className="text-emerald-500 dark:text-yellow-400" />
          <input
            className="min-w-0 flex-1 bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-50"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Destino o coordenadas: 19.43, -99.13"
            autoFocus
          />
        </label>
        <button
          type="submit"
          disabled={searching}
          className="min-h-12 rounded-2xl bg-emerald-600 px-4 font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-400 dark:bg-yellow-400 dark:text-slate-950 dark:hover:bg-yellow-300 dark:disabled:bg-slate-600"
        >
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4 grid gap-2">
          {suggestions.map((place) => (
            <button
              type="button"
              className="grid grid-cols-[24px_1fr] gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              key={`${place.display_name}-${place.lat}-${place.lng}`}
              onClick={() => onSelectDestination(place)}
            >
              <Search size={18} className="text-emerald-500 dark:text-yellow-400" />
              <div>
                <strong className="block">{place.name || place.display_name}</strong>
                <small className="line-clamp-2 text-slate-500">{place.display_name}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      {!query.trim() && frequentPlaces.length > 0 && (
        <div className="mt-4 grid gap-2">
          <small className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Mas usados</small>
          {frequentPlaces.map((place) => (
            <button type="button" className="grid grid-cols-[24px_1fr] gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800" key={`${place.name}-${place.lat}-${place.lng}`} onClick={() => onSelectDestination(place)}>
              <Search size={18} className="text-emerald-500 dark:text-yellow-400" />
              <div>
                <strong className="block">{place.name}</strong>
                <small className="text-slate-500">{place.detail}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      {!query.trim() && frequentPlaces.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
          Aun no hay lugares usados. Busca un destino para empezar a crear tu lista.
        </p>
      )}
    </section>
  );
}
