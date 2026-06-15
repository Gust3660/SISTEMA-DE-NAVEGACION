import { Compass, Fuel, Moon, Route, Sun, X } from 'lucide-react';
import { cx, drawerClass, drawerCloseClass, drawerHeadClass, inputClass, labelTextClass } from '../ui/classes.js';

function BuildingIcon(props) {
  return <Compass {...props} />;
}

export default function ConfigDrawer({
  theme,
  onThemeChange,
  isElectricVehicle,
  vehicleTypes,
  vehicleConfig,
  batteryUsed,
  estimatedBatteryLevel,
  onVehicleConfigChange,
  onClose
}) {
  return (
    <section className={drawerClass}>
      <div className={drawerHeadClass}>
        <button type="button" className={drawerCloseClass} onClick={onClose} aria-label="Cerrar ajustes"><X size={20} /></button>
        <strong>Configuracion del vehiculo</strong>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900" aria-label="Tema de la aplicacion">
        <button type="button" className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold transition', theme === 'light' ? 'bg-white text-emerald-600 shadow dark:bg-slate-800 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-300')} onClick={() => onThemeChange('light')}>
          <Sun size={18} />Claro
        </button>
        <button type="button" className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold transition', theme === 'dark' ? 'bg-white text-emerald-600 shadow dark:bg-slate-800 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-300')} onClick={() => onThemeChange('dark')}>
          <Moon size={18} />Oscuro
        </button>
      </div>

      {!isElectricVehicle && (
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <h3 className="font-black">Consumo de combustible</h3>
          <p className="text-sm text-slate-500">Ingresa el rendimiento de tu vehiculo para obtener estimaciones mas precisas de combustible y costos.</p>
          {[
            ['Autopista', '14.0', Route],
            ['Ciudad', '9.0', BuildingIcon],
            ['Combinado', '11.5', Fuel]
          ].map(([label, value, Icon]) => (
            <label key={label} className="grid grid-cols-[24px_1fr_90px_44px] items-center gap-2">
              <Icon size={19} className="text-emerald-500 dark:text-yellow-400" />
              <span>{label}</span>
              <input className={inputClass} value={value} readOnly />
              <small className="text-slate-500">km/L</small>
            </label>
          ))}
        </div>
      )}

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
        <h3 className="font-black">Tipo de vehiculo</h3>
        <p className="text-sm text-slate-500">Selecciona el tipo de vehiculo para obtener rutas mas adecuadas.</p>
        <div className="grid grid-cols-2 gap-3">
          {vehicleTypes.map(([Icon, vehicle]) => (
            <button
              type="button"
              key={vehicle}
              className={cx('grid min-h-24 place-items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center font-bold transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800', vehicleConfig.vehicle === vehicle && 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-300')}
              onClick={() => onVehicleConfigChange('vehicle', vehicle)}
            >
              <Icon size={24} />
              <span>{vehicle}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
        <h3 className="font-black">Otras preferencias</h3>
        {isElectricVehicle ? (
          <>
            <label className="grid gap-2">
              <span className={labelTextClass}>Nivel de bateria al iniciar el recorrido</span>
              <input className={inputClass} type="number" min="0" max="100" value={vehicleConfig.batteryLevel} onChange={(event) => onVehicleConfigChange('batteryLevel', event.target.value)} />
              <small className="text-slate-500">%</small>
            </label>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
              <span className={labelTextClass}>Consumo estimado del recorrido</span>
              <strong className="block text-xl text-emerald-500">{batteryUsed.toFixed(1)}%</strong>
              <small className="text-slate-500">{estimatedBatteryLevel.toFixed(0)}% al llegar</small>
            </div>
          </>
        ) : (
          <>
            <label className="grid gap-2">
              <span className={labelTextClass}>Rendimiento actual</span>
              <input className={inputClass} value={vehicleConfig.efficiency} onChange={(event) => onVehicleConfigChange('efficiency', event.target.value)} />
              <small className="text-slate-500">km/L</small>
            </label>
            <label className="grid gap-2">
              <span className={labelTextClass}>Tipo de combustible</span>
              <select className={inputClass} value={vehicleConfig.fuel} onChange={(event) => onVehicleConfigChange('fuel', event.target.value)}>
                <option>Gasolina</option>
                <option>Diesel</option>
              </select>
            </label>
          </>
        )}
        <label className="grid gap-2">
          <span className={labelTextClass}>Unidades de distancia</span>
          <select className={inputClass} value={vehicleConfig.units} onChange={(event) => onVehicleConfigChange('units', event.target.value)}>
            <option>Kilometros (km)</option>
            <option>Millas (mi)</option>
          </select>
        </label>
      </div>
    </section>
  );
}
