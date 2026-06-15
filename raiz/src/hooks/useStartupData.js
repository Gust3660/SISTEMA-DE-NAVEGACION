import { useEffect } from 'react';
import { fetchAlerts, fetchRecentRoutes } from '../services/api.js';
import { notifyInfo } from '../utils/notify.js';

export function useStartupData({
  setAlerts,
  setRecentRoutes,
  setRouteForm,
  setOriginName,
  setLocatingOrigin
}) {
  useEffect(() => {
    if (navigator.geolocation) {
      setLocatingOrigin(true);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setRouteForm((current) => ({
            ...current,
            origin_lat: coords.latitude.toFixed(6),
            origin_lng: coords.longitude.toFixed(6)
          }));
          setOriginName('Mi ubicacion real');
          setLocatingOrigin(false);
        },
        () => {
          setLocatingOrigin(false);
          notifyInfo('Selecciona el punto de partida o permite la ubicacion del navegador', 'startup-location-info');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }

    fetchAlerts()
      .then((data) => setAlerts(data.slice(-4).reverse()))
      .catch(() => setAlerts([]));
    fetchRecentRoutes()
      .then((routes) => setRecentRoutes(routes))
      .catch(() => setRecentRoutes([]));
  }, [setAlerts, setLocatingOrigin, setOriginName, setRecentRoutes, setRouteForm]);
}
