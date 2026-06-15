export function hasDestination(form) {
  const lat = String(form.dest_lat ?? '').trim();
  const lng = String(form.dest_lng ?? '').trim();
  return lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}
