import { useMemo } from 'react';
import { electricRangeKm } from '../data/routeData.js';
import { formatCoord } from '../utils/routeUtils.js';
import { hasDestination } from '../utils/routeGuards.js';

export function useRouteDerivedState({
  routeForm,
  routeResult,
  alerts,
  recentRoutes,
  vehicleConfig,
  destinationName
}) {
  const origin = useMemo(() => ({
    lat: Number(routeForm.origin_lat),
    lng: Number(routeForm.origin_lng)
  }), [routeForm.origin_lat, routeForm.origin_lng]);

  const destination = useMemo(() => {
    if (!hasDestination(routeForm)) return null;
    return {
      lat: Number(routeForm.dest_lat),
      lng: Number(routeForm.dest_lng)
    };
  }, [routeForm]);

  const duration = routeResult?.duration_minutes ?? 28;
  const distance = routeResult?.distance_km ?? 10.4;
  const fuelLiters = routeResult?.fuel_consumption_liters ?? 1.89;
  const tollCost = routeResult?.toll_cost_mxn ?? 156;
  const riskScore = routeResult?.risk_score ?? (alerts.length ? Math.min(65, 32 + alerts.length * 8) : 32);
  const redZoneCount = routeResult?.red_zones?.length ?? 0;
  const avoidedZoneCount = routeResult?.avoided_zones?.length ?? 0;
  const trafficLevel = routeResult?.traffic_level ?? 'normal';
  const trafficSource = routeResult?.optimization?.traffic_source === 'google_routes' ? 'Google' : 'local';
  const isElectricVehicle = vehicleConfig.vehicle === 'Electrico';
  const initialBatteryLevel = Math.min(Math.max(Number(vehicleConfig.batteryLevel) || 0, 0), 100);
  const batteryUsed = isElectricVehicle ? Math.min((distance / electricRangeKm) * 100, initialBatteryLevel) : 0;
  const estimatedBatteryLevel = Math.max(initialBatteryLevel - batteryUsed, 0);

  const frequentPlaces = useMemo(() => {
    const seen = new Set();
    return recentRoutes
      .filter((route) => route?.destination?.lat && route?.destination?.lng)
      .filter((route) => {
        const key = `${route.name}-${route.destination.lat}-${route.destination.lng}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6)
      .map((route) => ({
        name: route.name || 'Destino usado',
        detail: route.originName ? `Desde ${route.originName}` : 'Usado recientemente',
        lat: route.destination.lat,
        lng: route.destination.lng,
        display_name: route.name || 'Destino usado'
      }));
  }, [recentRoutes]);

  const routeSteps = useMemo(() => {
    const waypoints = routeResult?.waypoints ?? [];
    return [
      {
        title: 'Salir de Mi ubicacion',
        detail: formatCoord(routeForm.origin_lat, routeForm.origin_lng)
      },
      ...waypoints.map(([lat, lng], index) => ({
        title: `Tomar desvio seguro ${index + 1}`,
        detail: formatCoord(lat, lng)
      })),
      {
        title: `Llegar a ${destinationName}`,
        detail: formatCoord(routeForm.dest_lat, routeForm.dest_lng)
      }
    ];
  }, [destinationName, routeForm.dest_lat, routeForm.dest_lng, routeForm.origin_lat, routeForm.origin_lng, routeResult?.waypoints]);

  return {
    origin,
    destination,
    duration,
    distance,
    fuelLiters,
    tollCost,
    riskScore,
    redZoneCount,
    avoidedZoneCount,
    trafficLevel,
    trafficSource,
    isElectricVehicle,
    batteryUsed,
    estimatedBatteryLevel,
    frequentPlaces,
    routeSteps
  };
}
