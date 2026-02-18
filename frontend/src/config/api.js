/**
 * API Configuration for DriftX Frontend
 * 
 * In development, you can use the direct backend URL or the proxy.
 * In production, all API calls should go through the nginx proxy at /api/*
 */

// Determine the API base URL
// In production (when served through nginx), use relative /api path
// In development, you can override with VITE_API_URL environment variable
const getApiBaseUrl = () => {
  // Check if we have an environment variable override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use relative /api path (proxied by nginx)
  // In development, use direct backend connection for simplicity
  // You can change this to '/api' if you want to test the proxy in development
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Development: connect directly to backend
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If API_BASE_URL already ends with /, don't add another one
  const separator = API_BASE_URL.endsWith('/') ? '' : '/';
  
  return `${API_BASE_URL}${separator}${cleanEndpoint}`;
};

// Export individual API endpoints for convenience
export const API_ENDPOINTS = {
  HOME: buildApiUrl('/'),
  DRIFT: buildApiUrl('/drift'),
  TIMELINE: buildApiUrl('/timeline'),
  SNAPSHOT_INFO: buildApiUrl('/snapshot-info'),
  ALERTS: buildApiUrl('/alerts'),
  RESOURCE_ANALYSIS: buildApiUrl('/resource-analysis'),
  CURRENT_PROCESSES: buildApiUrl('/current-processes'),
  TRIGGER_SNAPSHOT: buildApiUrl('/trigger-snapshot'),
  SCHEDULER_STATUS: buildApiUrl('/scheduler-status'),
  PROCESS_DETAILS: (pid) => buildApiUrl(`/process-details/${pid}`),
};

export default API_BASE_URL;
