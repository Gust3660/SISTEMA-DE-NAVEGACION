export async function fetchRoute(payload) {
  const response = await fetch('/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error al calcular la ruta');
  }
  return data;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  return data;
}

export async function fetchSavedRoutes() {
  return requestJson('/routes/saved');
}

export async function saveSavedRoute(route) {
  return requestJson('/routes/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(route)
  });
}

export async function fetchRecentRoutes() {
  return requestJson('/routes/recent');
}

export async function saveRecentRoute(route) {
  return requestJson('/routes/recent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(route)
  });
}

export async function fetchGeocode(query) {
  const response = await fetch('/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error en geocodificación');
  }
  return data;
}

export async function fetchGeocodeSuggestions(query, origin) {
  const params = new URLSearchParams({ query });
  if (origin?.lat && origin?.lng) {
    params.set('lat', String(origin.lat));
    params.set('lng', String(origin.lng));
  }

  const response = await fetch(`/geocode/suggest?${params.toString()}`);
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error al buscar sugerencias');
  }
  return data;
}

export async function fetchAlerts() {
  const response = await fetch('/alerts');
  if (!response.ok) {
    throw new Error('Error al cargar alertas');
  }
  return response.json();
}

export async function sendTelemetry(payload) {
  const response = await fetch('/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error al enviar telemetría');
  }
  return data;
}

export async function fetchHealth() {
  const response = await fetch('/health');
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error al consultar estado de API');
  }
  return data;
}
