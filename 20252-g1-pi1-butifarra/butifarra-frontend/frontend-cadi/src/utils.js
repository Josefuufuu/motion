// src/utils.js

/**
 * Get cookie value by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} The value of the cookie, or null if not found
 */
export function getCookie(name) {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
}

/**
 * Format a date to a human-readable string
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Convert a form date and time inputs to an ISO string for the API
 * @param {string} date - The date string from a date input (YYYY-MM-DD)
 * @param {string} time - The time string from a time input (HH:MM)
 * @returns {string} An ISO formatted date-time string
 */
export function combineDateTime(date, time) {
  if (!date || !time) return null;
  return `${date}T${time}:00`;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {'success'|'error'|'info'} type - The type of toast
 */
export function showToast(message, type = 'info') {
  // This is a placeholder - you would implement this based on your toast notification system
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Example implementation - you might replace this with your actual toast component
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
