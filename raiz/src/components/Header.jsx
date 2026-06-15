export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="mb-4 rounded-lg border border-white/10 bg-neutral-900 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
          <div>
            <h1 className="text-xl font-semibold text-white">GPS LOCATION</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <button
            type="button"
            className="rounded-md border border-white/10 bg-white/10 px-3 py-2 font-semibold text-white transition hover:bg-white/20"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </button>
        </div>
      </div>
    </header>
  );
}
