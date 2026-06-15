import MapView from '../MapView.jsx';
import MapControls from '../layout/MapControls.jsx';
import RouteCard from '../route/RouteCard.jsx';
import SummarySheet from '../route/SummarySheet.jsx';
import { cx } from '../ui/classes.js';

export default function AppMainStage({
  currentTime,
  navigationActive,
  routeResult,
  origin,
  destination,
  trafficLevel,
  mapLayer,
  vehiclePosition,
  vehicleHeading,
  configOpen,
  setMapInstance,
  routeCardProps,
  mapControlProps,
  summaryOpen,
  summaryProps
}) {
  return (
    <main className="relative h-full w-full overflow-hidden">
      <div className={cx(
        'pointer-events-none fixed left-1/2 top-4 z-20 flex w-[min(520px,calc(100vw-7rem))] -translate-x-1/2 items-center justify-between text-xs font-black uppercase tracking-[0.08em] text-slate-800 dark:text-slate-100',
        navigationActive && 'hidden'
      )}>
        <span />
        <strong>GPS LOCATION</strong>
        <time className="text-sm" dateTime={new Date().toISOString()}>{currentTime}</time>
      </div>

      <MapView
        routePoly={routeResult?.polyline}
        origin={origin}
        destination={destination}
        redZones={routeResult?.red_zones ?? []}
        trafficLevel={trafficLevel}
        mapLayer={mapLayer}
        navigationActive={navigationActive}
        vehiclePosition={vehiclePosition}
        vehicleHeading={vehicleHeading}
        layoutKey={`${configOpen ? 'config-open' : 'config-closed'}-${navigationActive ? 'nav' : 'plan'}`}
        onMapReady={setMapInstance}
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-white/10 via-transparent to-white/10 dark:from-slate-950/20 dark:to-slate-950/20" />

      {!navigationActive && <RouteCard {...routeCardProps} />}

      {!navigationActive && <MapControls {...mapControlProps} />}

      {summaryOpen && routeResult && <SummarySheet {...summaryProps} />}
    </main>
  );
}
