// Configuration file for API endpoints

// Dynamically determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're running on a production domain (Render or other hosting)
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    // Use the same host but ensure we're using https
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // For local development, use localhost:3001
  return 'http://localhost:3001';
};

// Export the API base URL
window.API_BASE_URL = getApiBaseUrl();

console.log(`API Base URL configured: ${window.API_BASE_URL}`); 