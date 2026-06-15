import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notifySuccess, notifyError } from '../utils/notify.js';
import { formatDeviceTime } from '../utils/routeUtils.js';
import {
  bearingDegrees,
  decodeRoutePolyline,
  nearestRouteProgress,
  nextManeuver,
  pointAtDistance,
  routeMetrics
} from '../utils/navigationUtils.js';

export function useNavigationMode({ routeResult, duration }) {
  const [navigationActive, setNavigationActive] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [navigationPosition, setNavigationPosition] = useState(null);
  const [navigationSpeed, setNavigationSpeed] = useState(0);
  const [navigationSimulated, setNavigationSimulated] = useState(false);
  const [navigationDetailsOpen, setNavigationDetailsOpen] = useState(false);
  const navigationWatchRef = useRef(null);
  const navigationTimerRef = useRef(null);

  const routePoints = useMemo(() => decodeRoutePolyline(routeResult?.polyline), [routeResult?.polyline]);
  const routeNavMetrics = useMemo(() => routeMetrics(routePoints), [routePoints]);
  const vehiclePosition = navigationPosition || pointAtDistance(routePoints, routeNavMetrics.cumulative, navigationProgress);
  const vehicleAhead = pointAtDistance(routePoints, routeNavMetrics.cumulative, navigationProgress + 45);
  const vehicleHeading = vehiclePosition && vehicleAhead ? bearingDegrees(vehiclePosition, vehicleAhead) : 0;
  const remainingMeters = Math.max(routeNavMetrics.total - navigationProgress, 0);
  const remainingRatio = routeNavMetrics.total ? remainingMeters / routeNavMetrics.total : 1;
  const remainingMinutes = Math.max(0, duration * remainingRatio);
  const navigationArrival = formatDeviceTime(new Date(Date.now() + remainingMinutes * 60000));
  const currentManeuver = useMemo(
    () => nextManeuver(routePoints, routeNavMetrics.cumulative, navigationProgress),
    [navigationProgress, routeNavMetrics.cumulative, routePoints]
  );

  const stopNavigationTracking = useCallback(() => {
    if (navigationWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(navigationWatchRef.current);
      navigationWatchRef.current = null;
    }
    if (navigationTimerRef.current !== null) {
      window.clearInterval(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
  }, []);

  const startDemoNavigation = useCallback(() => {
    if (navigationTimerRef.current !== null) {
      window.clearInterval(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    setNavigationSimulated(true);
    setNavigationSpeed(35);
    navigationTimerRef.current = window.setInterval(() => {
      setNavigationProgress((current) => {
        const next = Math.min(current + 42, routeNavMetrics.total);
        const nextPosition = pointAtDistance(routePoints, routeNavMetrics.cumulative, next);
        if (nextPosition) setNavigationPosition(nextPosition);
        if (next >= routeNavMetrics.total - 8) {
          stopNavigationTracking();
          setNavigationActive(false);
          notifySuccess('Llegaste al destino', 'navigation-arrived');
        }
        return next;
      });
    }, 1600);
  }, [routeNavMetrics.cumulative, routeNavMetrics.total, routePoints, stopNavigationTracking]);

  useEffect(() => {
    if (!navigationActive) {
      stopNavigationTracking();
      setNavigationSimulated(false);
      return undefined;
    }

    if (!routePoints.length || !routeNavMetrics.total) {
      notifyError('No hay ruta calculada para navegar', 'navigation-no-route');
      setNavigationActive(false);
      return undefined;
    }

    const startPoint = pointAtDistance(routePoints, routeNavMetrics.cumulative, 0);
    setNavigationPosition(startPoint);

    if (!navigator.geolocation) {
      startDemoNavigation();
      return stopNavigationTracking;
    }

    let firstFixReceived = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!firstFixReceived && navigationActive) startDemoNavigation();
    }, 4500);

    navigationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        firstFixReceived = true;
        window.clearTimeout(fallbackTimer);
        if (navigationTimerRef.current !== null) {
          window.clearInterval(navigationTimerRef.current);
          navigationTimerRef.current = null;
        }
        setNavigationSimulated(false);
        const currentPosition = [position.coords.latitude, position.coords.longitude];
        const progress = nearestRouteProgress(routePoints, routeNavMetrics.cumulative, currentPosition);
        setNavigationPosition(currentPosition);
        setNavigationProgress(progress);
        setNavigationSpeed(Math.max(0, (position.coords.speed ?? 0) * 3.6));

        if (routeNavMetrics.total - progress < 25) {
          stopNavigationTracking();
          setNavigationActive(false);
          notifySuccess('Llegaste al destino', 'navigation-arrived');
        }
      },
      () => {
        window.clearTimeout(fallbackTimer);
        if (navigationActive) startDemoNavigation();
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 1200
      }
    );

    return () => {
      window.clearTimeout(fallbackTimer);
      stopNavigationTracking();
    };
  }, [
    navigationActive,
    routeNavMetrics.cumulative,
    routeNavMetrics.total,
    routePoints,
    startDemoNavigation,
    stopNavigationTracking
  ]);

  const resetNavigationStart = useCallback(() => {
    setNavigationProgress(0);
    setNavigationPosition(pointAtDistance(routePoints, routeNavMetrics.cumulative, 0));
    setNavigationSpeed(0);
    setNavigationSimulated(false);
    setNavigationDetailsOpen(false);
  }, [routeNavMetrics.cumulative, routePoints]);

  const stopNavigation = useCallback(() => {
    stopNavigationTracking();
    setNavigationActive(false);
    setNavigationPosition(null);
    setNavigationSimulated(false);
    setNavigationDetailsOpen(false);
  }, [stopNavigationTracking]);

  return {
    navigationActive,
    setNavigationActive,
    navigationProgress,
    navigationSpeed,
    navigationSimulated,
    navigationDetailsOpen,
    setNavigationDetailsOpen,
    routePoints,
    routeNavMetrics,
    vehiclePosition,
    vehicleHeading,
    remainingMeters,
    remainingMinutes,
    navigationArrival,
    currentManeuver,
    resetNavigationStart,
    stopNavigation,
    stopNavigationTracking
  };
}
