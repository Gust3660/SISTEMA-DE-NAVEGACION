import { useCallback, useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppMainStage from './components/app/AppMainStage.jsx';
import AppOverlays from './components/app/AppOverlays.jsx';
import SideRail from './components/layout/SideRail.jsx';
import { initialRoute, navItems, vehicleTypes } from './data/routeData.js';
import {
  fetchGeocode,
  fetchRecentRoutes,
  fetchRoute,
  fetchSavedRoutes,
  saveRecentRoute,
  saveSavedRoute
} from './services/api.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { useDeviceClock } from './hooks/useDeviceClock.js';
import { useDraggableOffset } from './hooks/useDraggableOffset.js';
import { useNavigationMode } from './hooks/useNavigationMode.js';
import { usePlaceSuggestions } from './hooks/usePlaceSuggestions.js';
import { useRouteDerivedState } from './hooks/useRouteDerivedState.js';
import { useStartupData } from './hooks/useStartupData.js';
import { buildPayload } from './utils/routeUtils.js';
import { hasDestination } from './utils/routeGuards.js';
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from './utils/notify.js';
import { pointAtDistance } from './utils/navigationUtils.js';

export default function App() {
  const [theme, setTheme] = useState('light');
  const currentTime = useDeviceClock();
  const [mapLayer, setMapLayer] = useState('standard');
  const [routeForm, setRouteForm] = useState(initialRoute);
  const [routeResult, setRouteResult] = useState(null);
  const [originName, setOriginName] = useState('Mi ubicacion');
  const [destinationName, setDestinationName] = useState('Selecciona destino');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [originEditing, setOriginEditing] = useState(false);
  const [originQuery, setOriginQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [originSearching, setOriginSearching] = useState(false);
  const [destinationEditing, setDestinationEditing] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [routeOptionsOpen, setRouteOptionsOpen] = useState(false);
  const [tollDetailOpen, setTollDetailOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const {
    offset: summaryOffset,
    dragging: summaryDragging,
    startDrag: startSummaryDrag
  } = useDraggableOffset();
  const [activeNav, setActiveNav] = useState('Navegar');
  const [alerts, setAlerts] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [locatingOrigin, setLocatingOrigin] = useState(false);
  const [vehicleConfig, setVehicleConfig] = useState({
    efficiency: '5.5',
    batteryLevel: '82',
    vehicle: 'Auto',
    fuel: 'Gasolina',
    units: 'Kilometros (km)'
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const rememberRecentRoute = useCallback(async (form, data, name = destinationName) => {
    if (!hasDestination(form)) return;
    const recentRoute = {
      name,
      originName,
      origin: { lat: Number(form.origin_lat), lng: Number(form.origin_lng) },
      destination: { lat: Number(form.dest_lat), lng: Number(form.dest_lng) },
      form,
      distance: data?.distance_km ?? 0,
      duration: data?.duration_minutes ?? 0,
      tollCost: data?.toll_cost_mxn ?? 0,
      vehicle: vehicleConfig.vehicle
    };

    try {
      await saveRecentRoute(recentRoute);
      const nextRoutes = await fetchRecentRoutes();
      setRecentRoutes(nextRoutes);
    } catch {
      // Recent routes are helpful history, not critical path.
    }
  }, [destinationName, originName, vehicleConfig.vehicle]);

  const refreshRoute = useCallback(async (form = routeForm, silent = false, remember = true) => {
    if (!hasDestination(form)) {
      setRouteResult(null);
      throw new Error('Selecciona un destino para calcular la ruta');
    }
    const data = await fetchRoute(buildPayload(form));
    setRouteResult(data);
    if (remember) rememberRecentRoute(form, data).catch(() => {});
    if (!silent) notifySuccess('Ruta actualizada', 'route-updated');
    return data;
  }, [rememberRecentRoute, routeForm]);

  const handleNewAlert = useCallback((payload) => {
    setAlerts((prev) => [payload, ...prev].slice(0, 4));
    notifyWarning(payload.message || 'Nueva alerta en la ruta', payload.message || 'route-alert');
  }, []);

  useWebSocket('/ws', handleNewAlert);

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
  }, []);

  const {
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
  } = useRouteDerivedState({
    routeForm,
    routeResult,
    alerts,
    recentRoutes,
    vehicleConfig,
    destinationName
  });

  const {
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
    stopNavigation
  } = useNavigationMode({ routeResult, duration });

  usePlaceSuggestions({
    enabled: searchOpen,
    query,
    origin,
    setSuggestions: setSearchSuggestions,
    setSearching
  });

  usePlaceSuggestions({
    enabled: originEditing,
    query: originQuery,
    origin,
    setSuggestions: setOriginSuggestions,
    setSearching: setOriginSearching
  });

  usePlaceSuggestions({
    enabled: destinationEditing,
    query: destinationQuery,
    origin,
    setSuggestions: setDestinationSuggestions,
    setSearching: setDestinationSearching
  });

  const updateVehicleConfig = (key, value) => {
    setVehicleConfig((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'vehicle' && value === 'Electrico' ? { fuel: 'Electrico' } : {}),
      ...(key === 'vehicle' && value !== 'Electrico' && prev.fuel === 'Electrico' ? { fuel: 'Gasolina' } : {})
    }));
    if (key === 'efficiency') {
      const kmPerLiter = Math.max(Number(value) || 1, 1);
      const nextForm = { ...routeForm, vehicle_consumption: String(100 / kmPerLiter) };
      setRouteForm(nextForm);
      if (hasDestination(nextForm)) {
        refreshRoute(nextForm, true).catch(() => notifyError('No se pudo recalcular consumo', 'fuel-recalc-error'));
      }
    }
  };

  const updateRouteOption = async (key, value) => {
    const nextForm = { ...routeForm, [key]: value };
    setRouteForm(nextForm);

    if (!hasDestination(nextForm)) {
      notifyInfo('Selecciona un destino para calcular opciones de ruta', 'route-options-need-destination');
      return;
    }

    try {
      await refreshRoute(nextForm, true);
      notifySuccess('Opciones de ruta actualizadas', 'route-options-updated');
    } catch {
      notifyError('No se pudo recalcular con esas opciones', 'route-options-error');
    }
  };

  const applyDestination = async (place) => {
    const nextForm = { ...routeForm, dest_lat: String(place.lat), dest_lng: String(place.lng) };
    setDestinationName(place.name || place.display_name || 'Destino');
    setRouteForm(nextForm);
    setSearchOpen(false);
    setDestinationEditing(false);
    setDestinationQuery('');
    setDestinationSuggestions([]);
    setActiveNav('Navegar');

    mapInstance?.flyTo([Number(place.lat), Number(place.lng)], Math.max(mapInstance.getZoom(), 13), {
      duration: 0.75
    });

    try {
      await refreshRoute(nextForm);
      notifySuccess('Destino actualizado', 'destination-updated');
    } catch {
      notifyError('No se pudo actualizar el destino', 'destination-update-error');
    }
  };

  const handleDestinationSearch = async (event) => {
    event.preventDefault();
    const value = destinationQuery.trim();
    if (!value) return;

    if (destinationSuggestions.length) {
      await applyDestination(destinationSuggestions[0]);
      return;
    }

    setDestinationSearching(true);
    try {
      const result = await fetchGeocode(value);
      await applyDestination({
        name: result.display_name,
        detail: result.engine,
        lat: result.lat,
        lng: result.lng
      });
    } catch {
      notifyError('Destino no encontrado. Prueba con nombre o coordenadas', 'destination-inline-not-found');
    } finally {
      setDestinationSearching(false);
    }
  };

  const applyOrigin = async (place) => {
    const nextForm = { ...routeForm, origin_lat: String(place.lat), origin_lng: String(place.lng) };
    setOriginName(place.name || place.display_name || 'Punto de partida');
    setRouteForm(nextForm);
    setOriginEditing(false);
    setOriginQuery('');
    setOriginSuggestions([]);

    mapInstance?.flyTo([Number(place.lat), Number(place.lng)], Math.max(mapInstance.getZoom(), 14), {
      duration: 0.75
    });

    try {
      if (hasDestination(nextForm)) {
        await refreshRoute(nextForm);
      }
      notifySuccess('Punto de partida actualizado', 'origin-manual-updated');
    } catch {
      notifyError('No se pudo actualizar el punto de partida', 'origin-manual-error');
    }
  };

  const handleOriginSearch = async (event) => {
    event.preventDefault();
    const value = originQuery.trim();
    if (!value) return;

    if (originSuggestions.length) {
      await applyOrigin(originSuggestions[0]);
      return;
    }

    setOriginSearching(true);
    try {
      const result = await fetchGeocode(value);
      await applyOrigin({
        name: result.display_name,
        detail: result.engine,
        lat: result.lat,
        lng: result.lng
      });
    } catch {
      notifyError('Punto de partida no encontrado. Prueba con nombre o coordenadas', 'origin-not-found');
    } finally {
      setOriginSearching(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    if (searchSuggestions.length) {
      await applyDestination(searchSuggestions[0]);
      return;
    }

    setSearching(true);
    try {
      const result = await fetchGeocode(value);
      await applyDestination({
        name: result.display_name,
        detail: result.engine,
        lat: result.lat,
        lng: result.lng
      });
    } catch {
      notifyError('Destino no encontrado. Prueba con nombre o coordenadas', 'destination-not-found');
    } finally {
      setSearching(false);
    }
  };

  const swapRoute = async () => {
    if (!hasDestination(routeForm)) {
      notifyInfo('Selecciona un destino antes de invertir la ruta', 'swap-needs-destination');
      return;
    }

    const nextForm = {
      ...routeForm,
      origin_lat: routeForm.dest_lat,
      origin_lng: routeForm.dest_lng,
      dest_lat: routeForm.origin_lat,
      dest_lng: routeForm.origin_lng
    };

    setRouteForm(nextForm);
    setOriginName(destinationName);
    setDestinationName(originName);

    try {
      await refreshRoute(nextForm, true);
      notifySuccess('Ruta invertida', 'route-swapped');
    } catch {
      notifyError('No se pudo invertir la ruta', 'route-swap-error');
    }
  };

  const locateOrigin = () => {
    if (!navigator.geolocation) {
      notifyError('Tu navegador no permite obtener la ubicacion', 'geolocation-unsupported');
      return;
    }

    setLocatingOrigin(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const nextForm = {
          ...routeForm,
          origin_lat: coords.latitude.toFixed(6),
          origin_lng: coords.longitude.toFixed(6)
        };

        setRouteForm(nextForm);
        setOriginName('Mi ubicacion real');
        mapInstance?.flyTo([coords.latitude, coords.longitude], Math.max(mapInstance.getZoom(), 15), {
          duration: 0.75
        });

        try {
          if (hasDestination(nextForm)) {
            await refreshRoute(nextForm, true);
          }
          notifySuccess('Punto de partida actualizado con tu ubicacion real', 'origin-updated');
        } catch {
          notifyError('Ubicacion obtenida, pero no se pudo recalcular la ruta', 'origin-route-error');
        } finally {
          setLocatingOrigin(false);
        }
      },
      () => {
        notifyError('No se pudo obtener tu ubicacion. Revisa el permiso del navegador', 'geolocation-error');
        setLocatingOrigin(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const zoomMap = (direction) => {
    if (!mapInstance) return;
    if (direction === 'in') {
      mapInstance.zoomIn();
    } else {
      mapInstance.zoomOut();
    }
  };

  const recenterNavigation = () => {
    const point = vehiclePosition || pointAtDistance(routePoints, routeNavMetrics.cumulative, navigationProgress);
    if (!mapInstance || !point) return;
    mapInstance.flyTo(point, Math.max(mapInstance.getZoom(), 17), {
      duration: 0.45
    });
  };

  const closePanel = (setter) => {
    setter(false);
    setActiveNav('Navegar');
  };

  const startNavigation = async () => {
    try {
      if (!hasDestination(routeForm)) {
        notifyInfo('Selecciona un destino para iniciar navegacion', 'navigation-needs-destination');
        return;
      }
      if (!routeResult) {
        await refreshRoute(routeForm, true);
      }
      setNavigationActive((current) => {
        const next = !current;
        if (next) {
          resetNavigationStart();
          setSummaryOpen(false);
          setStepsOpen(false);
          setSearchOpen(false);
          setConfigOpen(false);
          setFavoritesOpen(false);
          setRecentsOpen(false);
          notifySuccess('Navegacion iniciada', 'navigation-started');
        } else {
          stopNavigation();
          notifyInfo('Navegacion detenida', 'navigation-stopped');
        }
        return next;
      });
      const startPoint = pointAtDistance(routePoints, routeNavMetrics.cumulative, 0) || [origin.lat, origin.lng];
      mapInstance?.flyTo(startPoint, Math.max(mapInstance.getZoom(), 17), {
        duration: 0.75
      });
    } catch {
      notifyError('No se pudo iniciar la navegacion', 'navigation-start-error');
    }
  };

  const saveRoute = async () => {
    if (!hasDestination(routeForm) || !routeResult) {
      notifyInfo('Selecciona y calcula una ruta antes de guardarla', 'save-needs-route');
      return;
    }

    const savedRoute = {
      name: destinationName,
      originName,
      origin,
      destination,
      form: routeForm,
      distance,
      duration,
      tollCost,
      vehicle: vehicleConfig.vehicle,
      batteryLevel: isElectricVehicle ? estimatedBatteryLevel : null
    };

    try {
      await saveSavedRoute(savedRoute);
      const nextRoutes = await fetchSavedRoutes();
      setSavedRoutes(nextRoutes);
      notifySuccess('Ruta guardada en favoritos', 'route-saved');
    } catch {
      notifyError('No se pudo guardar la ruta', 'route-save-error');
    }
  };

  const startSummaryDrag = (event) => {
    const startY = event.clientY;
    const startOffset = summaryOffset;
    setSummaryDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent) => {
      const nextOffset = Math.min(Math.max(startOffset + startY - moveEvent.clientY, -220), 260);
      setSummaryOffset(nextOffset);
    };

    const handleEnd = () => {
      setSummaryDragging(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
  };

  const openFavorites = async () => {
    try {
      setSavedRoutes(await fetchSavedRoutes());
    } catch {
      setSavedRoutes([]);
      notifyError('No se pudieron leer los favoritos guardados', 'favorites-read-error');
    }
    setFavoritesOpen(true);
  };

  const openRecents = async () => {
    try {
      setRecentRoutes(await fetchRecentRoutes());
    } catch {
      setRecentRoutes([]);
      notifyError('No se pudieron leer las rutas recientes', 'recents-read-error');
    }
    setRecentsOpen(true);
  };

  const loadSavedRoute = async (savedRoute) => {
    const nextForm = savedRoute.form ?? {
      ...routeForm,
      origin_lat: String(savedRoute.origin.lat),
      origin_lng: String(savedRoute.origin.lng),
      dest_lat: String(savedRoute.destination.lat),
      dest_lng: String(savedRoute.destination.lng)
    };

    setRouteForm(nextForm);
    setOriginName(savedRoute.originName || 'Punto de partida');
    setDestinationName(savedRoute.name);
    setFavoritesOpen(false);
    setActiveNav('Navegar');

    try {
      const data = await refreshRoute(nextForm, true, false);
      await rememberRecentRoute(nextForm, data, savedRoute.name);
      notifySuccess('Ruta cargada desde favoritos', 'favorite-loaded');
    } catch {
      notifyError('No se pudo recalcular la ruta guardada', 'favorite-load-error');
    }
  };

  const loadRecentRoute = async (recentRoute) => {
    const nextForm = recentRoute.form ?? {
      ...routeForm,
      origin_lat: String(recentRoute.origin.lat),
      origin_lng: String(recentRoute.origin.lng),
      dest_lat: String(recentRoute.destination.lat),
      dest_lng: String(recentRoute.destination.lng)
    };

    setRouteForm(nextForm);
    setOriginName(recentRoute.originName || 'Punto de partida');
    setDestinationName(recentRoute.name);
    setRecentsOpen(false);
    setActiveNav('Navegar');

    try {
      const data = await refreshRoute(nextForm, true, false);
      await rememberRecentRoute(nextForm, data, recentRoute.name);
      notifySuccess('Ruta reciente cargada', 'recent-loaded');
    } catch {
      notifyError('No se pudo cargar la ruta reciente', 'recent-load-error');
    }
  };

  const handleNavSelect = (label) => {
    setActiveNav(label);
    setSearchOpen(false);
    setConfigOpen(false);
    setFavoritesOpen(false);
    setRecentsOpen(false);
    setStepsOpen(false);
    setRouteOptionsOpen(false);
    setTollDetailOpen(false);
    setSummaryOpen(label === 'Navegar');
    if (label === 'Buscar') {
      setSearchOpen(true);
      fetchRecentRoutes()
        .then((routes) => setRecentRoutes(routes))
        .catch(() => setRecentRoutes([]));
    }
    if (label === 'Ajustes') setConfigOpen(true);
    if (label === 'Favoritos') openFavorites();
    if (label === 'Recientes') openRecents();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-100 font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <ToastContainer
        position="top-right"
        theme={theme === 'light' ? 'light' : 'dark'}
        autoClose={2600}
        newestOnTop
        closeOnClick
      />

      {!navigationActive && <SideRail navItems={navItems} activeNav={activeNav} onSelect={handleNavSelect} />}

      <AppMainStage
        currentTime={currentTime}
        navigationActive={navigationActive}
        routeResult={routeResult}
        origin={origin}
        destination={destination}
        trafficLevel={trafficLevel}
        mapLayer={mapLayer}
        vehiclePosition={vehiclePosition}
        vehicleHeading={vehicleHeading}
        configOpen={configOpen}
        setMapInstance={setMapInstance}
        routeCardProps={{
          routeForm,
          originName,
          destinationName,
          originEditing,
          destinationEditing,
          originQuery,
          destinationQuery,
          originSuggestions,
          destinationSuggestions,
          originSearching,
          destinationSearching,
          onOriginQueryChange: setOriginQuery,
          onDestinationQueryChange: setDestinationQuery,
          onOriginSubmit: handleOriginSearch,
          onDestinationSubmit: handleDestinationSearch,
          onSelectOrigin: applyOrigin,
          onSelectDestination: applyDestination,
          onCancelOrigin: () => {
            setOriginEditing(false);
            setOriginQuery('');
            setOriginSuggestions([]);
          },
          onCancelDestination: () => {
            setDestinationEditing(false);
            setDestinationQuery('');
            setDestinationSuggestions([]);
          },
          onOpenOrigin: () => {
            setOriginQuery(`${routeForm.origin_lat}, ${routeForm.origin_lng}`);
            setDestinationEditing(false);
            setDestinationQuery('');
            setDestinationSuggestions([]);
            setOriginEditing(true);
          },
          onOpenDestination: () => {
            setDestinationQuery(destinationName || `${routeForm.dest_lat}, ${routeForm.dest_lng}`);
            setOriginEditing(false);
            setOriginQuery('');
            setOriginSuggestions([]);
            setDestinationSuggestions([]);
            setDestinationEditing(true);
          },
          onSwapRoute: swapRoute,
          onOpenRouteOptions: () => setRouteOptionsOpen(true),
          onLeaveNow: () => notifyInfo('Salida configurada para ahora', 'leave-now')
        }}
        mapControlProps={{
          mapLayer,
          locatingOrigin,
          onToggleLayer: () => setMapLayer((current) => (current === 'standard' ? 'satellite' : 'standard')),
          onLocateOrigin: locateOrigin,
          onZoom: zoomMap
        }}
        summaryOpen={summaryOpen}
        summaryProps={{
          dragging: summaryDragging,
          offset: summaryOffset,
          onStartDrag: startSummaryDrag,
          duration,
          distance,
          isElectricVehicle,
          estimatedBatteryLevel,
          fuelLiters,
          tollCost,
          riskScore,
          redZoneCount,
          trafficLevel,
          trafficSource,
          alertsCount: alerts.length,
          avoidedZoneCount,
          navigationActive,
          onStartNavigation: startNavigation,
          onOpenSteps: () => setStepsOpen(true),
          onSaveRoute: saveRoute,
          onOpenTollDetail: () => setTollDetailOpen(true)
        }}
      />

      <AppOverlays
        navigationActive={navigationActive}
        navigationHudProps={{
          maneuver: currentManeuver,
          arrivalTime: navigationArrival,
          remainingMinutes,
          remainingKm: remainingMeters / 1000,
          speedKmh: navigationSpeed,
          simulated: navigationSimulated,
          detailsOpen: navigationDetailsOpen,
          totalDistanceKm: distance,
          tollCost,
          riskScore,
          mapLayer,
          onToggleLayer: () => setMapLayer((current) => (current === 'standard' ? 'satellite' : 'standard')),
          onRecenter: recenterNavigation,
          onZoom: zoomMap,
          onToggleDetails: () => setNavigationDetailsOpen((current) => !current),
          onStop: () => {
            stopNavigation();
            notifyInfo('Navegacion detenida', 'navigation-stopped');
          }
        }}
        stepsOpen={stepsOpen}
        stepsProps={{
          routeSteps,
          distance,
          duration,
          riskScore,
          onClose: () => setStepsOpen(false)
        }}
        searchOpen={searchOpen}
        searchProps={{
          query,
          searching,
          suggestions: searchSuggestions,
          frequentPlaces,
          onQueryChange: setQuery,
          onSubmit: handleSearch,
          onClose: () => closePanel(setSearchOpen),
          onSelectDestination: applyDestination
        }}
        favoritesOpen={favoritesOpen}
        favoritesProps={{
          routes: savedRoutes,
          onClose: () => closePanel(setFavoritesOpen),
          onLoad: loadSavedRoute
        }}
        recentsOpen={recentsOpen}
        recentsProps={{
          routes: recentRoutes,
          onClose: () => closePanel(setRecentsOpen),
          onLoad: loadRecentRoute
        }}
        routeOptionsOpen={routeOptionsOpen}
        routeOptionsProps={{
          routeForm,
          tollCost,
          routeResult,
          isElectricVehicle,
          onClose: () => setRouteOptionsOpen(false),
          onUpdateRouteOption: updateRouteOption
        }}
        tollDetailOpen={tollDetailOpen}
        tollDetailProps={{
          tollCost,
          routeResult,
          routeForm,
          onClose: () => setTollDetailOpen(false)
        }}
        configOpen={configOpen}
        configProps={{
          theme,
          onThemeChange: setTheme,
          isElectricVehicle,
          vehicleTypes,
          vehicleConfig,
          batteryUsed,
          estimatedBatteryLevel,
          onVehicleConfigChange: updateVehicleConfig,
          onClose: () => closePanel(setConfigOpen)
        }}
      />
    </div>
  );
}
