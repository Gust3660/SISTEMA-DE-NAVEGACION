import MapView from './MapView.jsx';

export default function MapPanel({ routeResult, origin, destination }) {
  const originCoords = origin
    ? { lat: parseFloat(origin.origin_lat), lng: parseFloat(origin.origin_lng) }
    : null;
  const destinationCoords = destination
    ? { lat: parseFloat(destination.dest_lat), lng: parseFloat(destination.dest_lng) }
    : null;

  return (
    <section className="flex min-h-[78vh] flex-col rounded-lg border border-white/10 bg-neutral-900">
      <div className="map-frame flex-1 bg-neutral-950">
        <MapView routePoly={routeResult?.polyline} origin={originCoords} destination={destinationCoords} />
      </div>
    </section>
  );
}
