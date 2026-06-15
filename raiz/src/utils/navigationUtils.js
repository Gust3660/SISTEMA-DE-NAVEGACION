import polyline from '@mapbox/polyline';

const EARTH_RADIUS_M = 6371000;

export function decodeRoutePolyline(routePoly) {
  if (!routePoly) return [];
  return polyline.decode(routePoly).map(([lat, lng]) => [lat, lng]);
}

export function distanceMeters(a, b) {
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const value = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  );
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function bearingDegrees(a, b) {
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function routeMetrics(route) {
  const cumulative = [0];
  for (let index = 1; index < route.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distanceMeters(route[index - 1], route[index]));
  }
  return {
    cumulative,
    total: cumulative[cumulative.length - 1] || 0
  };
}

export function pointAtDistance(route, cumulative, targetMeters) {
  if (!route.length) return null;
  if (targetMeters <= 0) return route[0];
  const total = cumulative[cumulative.length - 1] || 0;
  if (targetMeters >= total) return route[route.length - 1];

  for (let index = 1; index < route.length; index += 1) {
    if (cumulative[index] < targetMeters) continue;
    const segmentStart = route[index - 1];
    const segmentEnd = route[index];
    const segmentDistance = cumulative[index] - cumulative[index - 1];
    const ratio = segmentDistance ? (targetMeters - cumulative[index - 1]) / segmentDistance : 0;
    return [
      segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * ratio,
      segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * ratio
    ];
  }

  return route[route.length - 1];
}

export function nearestRouteProgress(route, cumulative, position) {
  if (!route.length || !position) return 0;

  let best = { distance: Infinity, progress: 0 };
  for (let index = 1; index < route.length; index += 1) {
    const projected = projectPointToSegment(position, route[index - 1], route[index]);
    const distance = distanceMeters(position, projected.point);
    if (distance < best.distance) {
      const segmentMeters = cumulative[index] - cumulative[index - 1];
      best = {
        distance,
        progress: cumulative[index - 1] + segmentMeters * projected.ratio
      };
    }
  }
  return best.progress;
}

export function nextManeuver(route, cumulative, progressMeters) {
  if (route.length < 4) {
    return {
      type: 'straight',
      label: 'Continua',
      detail: 'Sigue sobre la ruta',
      distance: Math.max((cumulative[cumulative.length - 1] || 0) - progressMeters, 0)
    };
  }

  const startIndex = cumulative.findIndex((meters) => meters >= progressMeters + 35);
  const fromIndex = Math.max(startIndex, 1);

  for (let index = fromIndex; index < route.length - 2; index += 1) {
    const before = route[Math.max(0, index - 2)];
    const current = route[index];
    const after = route[Math.min(route.length - 1, index + 2)];
    const turn = normalizeTurn(bearingDegrees(before, current), bearingDegrees(current, after));

    if (Math.abs(turn) < 35) continue;

    return {
      type: turn > 0 ? 'right' : 'left',
      label: turn > 0 ? 'Gira a la derecha' : 'Gira a la izquierda',
      detail: 'Mantente en la ruta marcada',
      distance: Math.max(cumulative[index] - progressMeters, 0)
    };
  }

  return {
    type: 'straight',
    label: 'Continua',
    detail: 'Hacia el destino',
    distance: Math.max((cumulative[cumulative.length - 1] || 0) - progressMeters, 0)
  };
}

export function formatInstructionDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
}

function projectPointToSegment(point, start, end) {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(toRad((start[0] + end[0]) / 2));
  const px = (point[1] - start[1]) * lngScale;
  const py = (point[0] - start[0]) * latScale;
  const vx = (end[1] - start[1]) * lngScale;
  const vy = (end[0] - start[0]) * latScale;
  const lengthSq = vx * vx + vy * vy;
  const ratio = lengthSq ? Math.min(Math.max((px * vx + py * vy) / lengthSq, 0), 1) : 0;

  return {
    ratio,
    point: [
      start[0] + (end[0] - start[0]) * ratio,
      start[1] + (end[1] - start[1]) * ratio
    ]
  };
}

function normalizeTurn(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function toRad(value) {
  return value * Math.PI / 180;
}

function toDeg(value) {
  return value * 180 / Math.PI;
}
