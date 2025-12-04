import { useRef, useState, useCallback } from 'react';
import { WSMessage } from '../types';

const API_URL = process.env.NODE_ENV === 'production' 
  ? ''
  : 'http://localhost:5001';

const WS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost:5001/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  // Connect to WebSocket with JWT token
  const connectWithToken = useCallback((jwtToken: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING ||
        isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    tokenRef.current = jwtToken;
    const wsUrl = `${WS_BASE_URL}/${jwtToken}`;
    console.log('Attempting WebSocket connection to:', wsUrl.substring(0, 50) + '...');
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnectingRef.current = false;
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
      isConnectingRef.current = false;
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect if we have a token and it wasn't a clean close
      if (event.code !== 1000 && event.code !== 1001) {
        const savedToken = tokenRef.current;
        if (savedToken) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting reconnect...');
            connectWithToken(savedToken);
          }, 3000);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnectingRef.current = false;
    };

    wsRef.current = ws;
  }, []);

  // Login via API and get JWT token
  const login = useCallback(async (nickname: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Logging in with nickname:', nickname);
      const response = await fetch(`${API_URL}/api/login/${encodeURIComponent(nickname)}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data.message);
        return { success: false, error: data.message || 'Login failed' };
      }

      console.log('Login successful, token received');
      
      // Connect WebSocket with token
      connectWithToken(data.token);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Nie można połączyć z serwerem' };
    }
  }, [connectWithToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    isConnectingRef.current = false;
    tokenRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WSMessage) => {
    console.log('sendMessage called, readyState:', wsRef.current?.readyState, 'OPEN:', WebSocket.OPEN);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message.type);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected, readyState:', wsRef.current?.readyState);
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    login,
    disconnect,
  };
}
