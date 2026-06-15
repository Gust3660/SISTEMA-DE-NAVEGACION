import { useEffect, useState } from 'react';

export function useWebSocket(endpoint, onMessage) {
  const [status, setStatus] = useState('Conectando...');

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}${endpoint}`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => setStatus('Conectado'));
    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (error) {
        console.error('Mensaje WS inválido', error);
      }
    });
    socket.addEventListener('close', () => setStatus('Desconectado'));
    socket.addEventListener('error', () => setStatus('Error de conexión'));

    return () => socket.close();
  }, [endpoint, onMessage]);

  return status;
}
