import { X } from 'lucide-react';
import { drawerClass, drawerCloseClass, drawerHeadClass, labelTextClass, panelCardClass } from '../ui/classes.js';

export default function TollDetailDrawer({ tollCost, routeResult, routeForm, onClose }) {
  return (
    <section className={drawerClass} aria-label="Detalle de casetas">
      <div className={drawerHeadClass}>
        <button type="button" className={drawerCloseClass} onClick={onClose} aria-label="Cerrar detalle de casetas"><X size={20} /></button>
        <strong>Detalle de casetas</strong>
      </div>

      <div className="grid gap-3">
        <div className={panelCardClass}>
          <span className={labelTextClass}>Costo estimado</span>
          <strong className="block">${Number(tollCost).toFixed(2)} MXN</strong>
        </div>
        <div className={panelCardClass}>
          <span className={labelTextClass}>Fuente</span>
          <strong className="block">{routeResult?.toll_cost_source === 'inegi_sakbe' ? 'INEGI Sakbe' : 'Estimacion local'}</strong>
        </div>
        <div className={panelCardClass}>
          <span className={labelTextClass}>Modo</span>
          <strong className="block">{routeForm.avoid_tolls ? 'Evitando peajes' : 'Ruta con peajes permitidos'}</strong>
        </div>
        <div className={panelCardClass}>
          <span className={labelTextClass}>Tramos detectados</span>
          <strong className="block">
            {routeResult?.toll_corridors?.length
              ? routeResult.toll_corridors.join(', ')
              : 'Sin tramos con caseta detectados'}
          </strong>
        </div>
        <div className={panelCardClass}>
          <span className={labelTextClass}>Costo total estimado</span>
          <strong className="block">${Number(routeResult?.total_cost_mxn ?? tollCost).toFixed(2)} MXN</strong>
        </div>
      </div>
    </section>
  );
}
