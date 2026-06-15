import {
  Car,
  History,
  Navigation,
  Search,
  Settings,
  Star,
  Truck,
  Zap
} from 'lucide-react';

export const initialRoute = {
  origin_lat: '19.432608',
  origin_lng: '-99.133209',
  dest_lat: '',
  dest_lng: '',
  vehicle_consumption: '18.18',
  fuel_price_per_liter: '23.5',
  toll_cost_mxn: '0',
  avoid_tolls: false,
  avoid_highways: false
};

export const navItems = [
  [Navigation, 'Navegar'],
  [Search, 'Buscar'],
  [Star, 'Favoritos'],
  [History, 'Recientes'],
  [Settings, 'Ajustes']
];

export const destinations = [
  ['Casa', 'Calle 123, Col. Roma Norte, CDMX', '19.418790', '-99.162870'],
  ['Trabajo', 'Av. Reforma 222, Juarez, CDMX', '19.428470', '-99.161480'],
  ['Aeropuerto Internacional Benito Juarez', 'Av. Capitan Carlos Leon, Venustiano Carranza', '19.436080', '-99.071910'],
  ['Centro Comercial Santa Fe', 'Vasco de Quiroga 3800, Santa Fe, CDMX', '19.358710', '-99.274450'],
  ['Estadio Azteca', 'Calz. de Tlalpan 3465, Santa Ursula Coapa', '19.302860', '-99.150530']
].map(([name, detail, lat, lng]) => ({ name, detail, lat, lng }));

export const vehicleTypes = [
  [Car, 'Auto'],
  [Car, 'SUV'],
  [Truck, 'Camioneta'],
  [Truck, 'Trailer 3 ejes'],
  [Zap, 'Electrico']
];

export const electricRangeKm = 420;
