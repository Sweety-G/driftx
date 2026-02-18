/**
 * API Configuration
 * Dynamically determines the API URL based on the browser's current address
 * or uses an environment variable override if provided.
 */

/**
 * Get the base API URL
 * @returns {string} The API base URL
 */
export function getApiBaseUrl() {
  // Check if environment variable is set
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  if (envApiUrl) {
    // Remove trailing slash if present
    return envApiUrl.replace(/\/$/, '');
  }
  
  // Dynamically build API URL from browser's current address
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: or https:
  
  // Use port 8000 for API (backend port)
  const apiPort = 8000;
  
  return `${protocol}//${hostname}:${apiPort}`;
}

/**
 * Get a full API URL for a specific endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/drift', '/timeline')
 * @returns {string} The complete API URL
 */
export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Get the API base URL for display purposes
 * @returns {string} The API base URL
 */
export function getApiDisplayUrl() {
  return getApiBaseUrl();
}
