// API Configuration
// Base path for production deployment under /casino/
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/casino/' : '';

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? BASE_PATH
  : 'http://localhost:5001';

export const WS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${BASE_PATH}/ws`
  : 'ws://localhost:5001/ws';
