import { toast } from 'react-toastify';

function stableToastId(type, message, id) {
  return id || `${type}:${message}`;
}

export function notify(type, message, id) {
  const toastId = stableToastId(type, message, id);
  if (toast.isActive(toastId)) return;
  toast[type](message, { toastId });
}

export const notifySuccess = (message, id) => notify('success', message, id);
export const notifyInfo = (message, id) => notify('info', message, id);
export const notifyWarning = (message, id) => notify('warn', message, id);
export const notifyError = (message, id) => notify('error', message, id);
