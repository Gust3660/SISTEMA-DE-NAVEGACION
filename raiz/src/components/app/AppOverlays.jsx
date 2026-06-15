import { History, Star } from 'lucide-react';
import NavigationHud from '../navigation/NavigationHud.jsx';
import ConfigDrawer from '../panels/ConfigDrawer.jsx';
import RouteListDrawer from '../panels/RouteListDrawer.jsx';
import RouteOptionsDrawer from '../panels/RouteOptionsDrawer.jsx';
import SearchPanel from '../panels/SearchPanel.jsx';
import StepsDrawer from '../panels/StepsDrawer.jsx';
import TollDetailDrawer from '../panels/TollDetailDrawer.jsx';

export default function AppOverlays({
  navigationActive,
  navigationHudProps,
  stepsOpen,
  stepsProps,
  searchOpen,
  searchProps,
  favoritesOpen,
  favoritesProps,
  recentsOpen,
  recentsProps,
  routeOptionsOpen,
  routeOptionsProps,
  tollDetailOpen,
  tollDetailProps,
  configOpen,
  configProps
}) {
  return (
    <>
      {navigationActive && <NavigationHud {...navigationHudProps} />}

      {stepsOpen && <StepsDrawer {...stepsProps} />}

      {searchOpen && <SearchPanel {...searchProps} />}

      {favoritesOpen && (
        <RouteListDrawer
          title="Rutas guardadas"
          ariaLabel="Rutas guardadas"
          ItemIcon={Star}
          EmptyIcon={Star}
          emptyTitle="No hay rutas guardadas"
          emptyText="Usa el boton Guardar en el resumen para agregar rutas a favoritos."
          {...favoritesProps}
        />
      )}

      {recentsOpen && (
        <RouteListDrawer
          title="Rutas recientes"
          ariaLabel="Rutas recientes"
          ItemIcon={History}
          EmptyIcon={History}
          emptyTitle="No hay rutas recientes"
          emptyText="Las rutas que calcules o cargues apareceran aqui automaticamente."
          {...recentsProps}
        />
      )}

      {routeOptionsOpen && <RouteOptionsDrawer {...routeOptionsProps} />}

      {tollDetailOpen && <TollDetailDrawer {...tollDetailProps} />}

      {configOpen && <ConfigDrawer {...configProps} />}
    </>
  );
}
