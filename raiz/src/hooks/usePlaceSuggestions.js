import { useEffect } from 'react';
import { fetchGeocodeSuggestions } from '../services/api.js';

export function usePlaceSuggestions({
  enabled,
  query,
  origin,
  setSuggestions,
  setSearching
}) {
  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetchGeocodeSuggestions(query.trim(), origin)
        .then((suggestions) => {
          if (active) setSuggestions(suggestions);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [enabled, origin, query, setSearching, setSuggestions]);
}
