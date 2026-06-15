import { cx } from '../ui/classes.js';

export default function SideRail({ navItems, activeNav, onSelect }) {
  return (
    <aside className="fixed left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-[28px] border border-slate-200/80 bg-white/90 p-2 shadow-uber backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/90">
      {navItems.map(([Icon, label]) => (
        <button
          key={label}
          type="button"
          className={cx(
            'relative grid size-12 place-items-center rounded-2xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-yellow-400',
            'after:pointer-events-none after:absolute after:left-[calc(100%+0.65rem)] after:top-1/2 after:hidden after:-translate-y-1/2 after:whitespace-nowrap after:rounded-xl after:bg-slate-950 after:px-3 after:py-1.5 after:text-xs after:font-bold after:text-white after:content-[attr(data-label)] hover:after:block dark:after:bg-white dark:after:text-slate-950',
            activeNav === label && 'bg-emerald-100 text-emerald-500 dark:bg-slate-800 dark:text-yellow-400'
          )}
          data-label={label}
          onClick={() => onSelect(label)}
          aria-label={label}
        >
          <Icon size={24} strokeWidth={2.3} />
        </button>
      ))}
    </aside>
  );
}
