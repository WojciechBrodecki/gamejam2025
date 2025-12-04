// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''
  : 'http://192.168.10.180:5001';

export const WS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `ws://${window.location.host}/ws`
  : 'ws://192.168.10.180:5001/ws';
