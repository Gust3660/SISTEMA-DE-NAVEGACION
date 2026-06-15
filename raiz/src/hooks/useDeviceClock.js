import { useEffect, useState } from 'react';
import { formatDeviceTime } from '../utils/routeUtils.js';

export function useDeviceClock() {
  const [currentTime, setCurrentTime] = useState(() => formatDeviceTime(new Date()));

  useEffect(() => {
    const tick = () => setCurrentTime(formatDeviceTime(new Date()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return currentTime;
}
