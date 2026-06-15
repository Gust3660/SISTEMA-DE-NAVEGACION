export function buildPayload(form) {
  return {
    origin_lat: Number(form.origin_lat),
    origin_lng: Number(form.origin_lng),
    dest_lat: Number(form.dest_lat),
    dest_lng: Number(form.dest_lng),
    vehicle_consumption: Number(form.vehicle_consumption),
    fuel_price_per_liter: Number(form.fuel_price_per_liter),
    toll_cost_mxn: Number(form.toll_cost_mxn),
    avoid_tolls: form.avoid_tolls,
    avoid_highways: form.avoid_highways
  };
}

export function formatCoord(lat, lng) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return 'Sin coordenadas';
  }
  return `${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`;
}

export function formatDeviceTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function clampBatteryLevel(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 100);
}
