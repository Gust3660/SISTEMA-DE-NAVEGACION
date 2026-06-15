import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { bearingDegrees, decodeRoutePolyline, pointAtDistance, routeMetrics } from '../utils/navigationUtils.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

function ResizeMap({ layoutKey }) {
  const map = useMap();

  useEffect(() => {
    const timers = [0, 120, 280, 520].map((delay) => (
      window.setTimeout(() => map.invalidateSize({ pan: false }), delay)
    ));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [layoutKey, map]);

  return null;
}

function MapReady({ onMapReady }) {
  const map = useMap();

  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);

  return null;
}

function FitRoute({ route, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (map.navigationMode) return;
    const points = route.length
      ? route
      : [origin, destination]
          .filter(Boolean)
          .map((point) => [Number(point.lat), Number(point.lng)]);

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 13), { animate: false });
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [120, 90],
      paddingBottomRight: [120, 260],
      maxZoom: 15,
      animate: false
    });
  }, [destination, map, origin, route]);

  return null;
}

function FollowNavigation({ active, position, heading }) {
  const map = useMap();

  useEffect(() => {
    map.navigationMode = active;
    return () => {
      map.navigationMode = false;
    };
  }, [active, map]);

  useEffect(() => {
    if (!active || !position) return;
    map.setView(position, Math.max(map.getZoom(), 17), {
      animate: true,
      duration: 0.35
    });
    map.getContainer().style.setProperty('--vehicle-heading', `${heading || 0}deg`);
  }, [active, heading, map, position]);

  return null;
}

const vehicleIcon = L.divIcon({
  className: '',
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  html: `
    <div class="grid size-[46px] place-items-center rounded-full bg-emerald-400/20">
      <div class="grid size-9 place-items-center rounded-full bg-white shadow-lg ring-2 ring-emerald-300">
        <div class="h-0 w-0 rotate-[var(--vehicle-heading)] border-x-[9px] border-b-[24px] border-x-transparent border-b-emerald-600 drop-shadow"></div>
      </div>
    </div>
  `
});

const originIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -16],
  html: `
    <div class="grid size-[34px] place-items-center rounded-full bg-emerald-500/15 shadow-lg ring-1 ring-white/80">
      <div class="grid size-6 place-items-center rounded-full bg-white shadow ring-1 ring-emerald-100">
        <div class="size-3 rounded-full border-[4px] border-emerald-500 bg-white"></div>
      </div>
    </div>
  `
});

const destinationIcon = L.divIcon({
  className: '',
  iconSize: [42, 50],
  iconAnchor: [21, 47],
  popupAnchor: [0, -42],
  html: `
    <div class="relative grid h-[50px] w-[42px] place-items-center">
      <svg viewBox="0 0 48 58" class="h-[50px] w-[42px] drop-shadow-lg">
        <path d="M24 2C13.5 2 5 10.3 5 20.5c0 13.4 19 35.5 19 35.5s19-22.1 19-35.5C43 10.3 34.5 2 24 2z" fill="#ef4444"></path>
        <circle cx="24" cy="20.5" r="7.4" fill="white"></circle>
      </svg>
    </div>
  `
});

function routeArrowIcon(heading) {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div class="grid size-7 place-items-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
        <svg viewBox="0 0 24 24" class="size-5" style="transform: rotate(${heading}deg)">
          <path d="M12 3l7 18-7-4-7 4 7-18z" fill="currentColor"></path>
        </svg>
      </div>
    `
  });
}

export default function MapView({
  routePoly,
  origin,
  destination,
  redZones = [],
  trafficLevel = 'normal',
  mapLayer = 'standard',
  navigationActive = false,
  vehiclePosition = null,
  vehicleHeading = 0,
  layoutKey = '',
  onMapReady
}) {
  const route = useMemo(() => {
    if (!routePoly) return [];
    return decodeRoutePolyline(routePoly);
  }, [routePoly]);

  const navArrows = useMemo(() => {
    if (!navigationActive || route.length < 2) return [];
    const metrics = routeMetrics(route);
    const arrows = [];
    for (let meters = 250; meters < metrics.total; meters += 520) {
      const point = pointAtDistance(route, metrics.cumulative, meters);
      const ahead = pointAtDistance(route, metrics.cumulative, meters + 35);
      if (point && ahead) {
        arrows.push({
          id: `${Math.round(meters)}-${point[0].toFixed(5)}`,
          point,
          heading: bearingDegrees(point, ahead)
        });
      }
    }
    return arrows;
  }, [navigationActive, route]);

  const center = useMemo(() => {
    if (route.length > 0) return route[Math.floor(route.length / 2)];
    if (origin) return [Number(origin.lat), Number(origin.lng)];
    return [19.43, -99.14];
  }, [route, origin]);

  const navigationRouteClass = mapLayer === 'satellite' ? 'stroke-violet-800 opacity-70' : 'stroke-emerald-700 opacity-60';
  const navigationRouteCoreClass = mapLayer === 'satellite' ? 'stroke-violet-600' : 'stroke-emerald-500';

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full" zoomControl={false} attributionControl={false}>
        <MapReady onMapReady={onMapReady} />
        <ResizeMap layoutKey={`${layoutKey}-${mapLayer}`} />
        <FitRoute route={route} origin={origin} destination={destination} />
        <FollowNavigation active={navigationActive} position={vehiclePosition} heading={vehicleHeading} />
        {mapLayer === 'satellite' ? (
          <TileLayer
            key="satellite"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer key="standard" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        )}
        {route.length > 0 && (
          <>
            <Polyline positions={route} pathOptions={{ className: navigationActive ? navigationRouteClass : 'stroke-violet-500 opacity-60', weight: navigationActive ? 14 : 10 }} />
            <Polyline positions={route} pathOptions={{ className: navigationActive ? navigationRouteCoreClass : 'stroke-emerald-500', weight: navigationActive ? 8 : 6 }} />
            {trafficLevel !== 'normal' && (
              <Polyline
                positions={route}
                pathOptions={{
                  className: trafficLevel === 'pesado' ? 'stroke-red-500 opacity-70' : 'stroke-orange-400 opacity-70',
                  weight: 4,
                  dashArray: '10 12'
                }}
              />
            )}
          </>
        )}
        {navArrows.map((arrow) => (
          <Marker key={arrow.id} position={arrow.point} icon={routeArrowIcon(arrow.heading)} interactive={false} />
        ))}
        {redZones.map((zone) => (
          <Polygon
            key={zone.name}
            positions={zone.polygon.map(([lng, lat]) => [lat, lng])}
            pathOptions={{
              className: 'fill-red-500 stroke-red-500 opacity-30',
              weight: 2
            }}
          >
            <Popup>{zone.name}</Popup>
          </Polygon>
        ))}
        {origin && (
          <Marker position={[Number(origin.lat), Number(origin.lng)]} icon={originIcon}>
            <Popup>Inicio</Popup>
          </Marker>
        )}
        {navigationActive && vehiclePosition && (
          <Marker position={vehiclePosition} icon={vehicleIcon}>
            <Popup>Navegando</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[Number(destination.lat), Number(destination.lng)]} icon={destinationIcon}>
            <Popup>Destino</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
