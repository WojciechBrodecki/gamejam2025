import { useRef, useState, useCallback } from 'react';
import { WSMessage } from '../types';
import { API_BASE_URL, WS_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

const TOKEN_STORAGE_KEY = 'grand_wager_token';
const NICKNAME_STORAGE_KEY = 'grand_wager_nickname';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const connectWithToken = useCallback((jwtToken: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING ||
        isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    tokenRef.current = jwtToken;
    const wsUrl = `${WS_BASE_URL}/${jwtToken}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnectingRef.current = false;
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onclose = (event) => {
      isConnectingRef.current = false;
      setIsConnected(false);
      wsRef.current = null;

      if (event.code !== 1000 && event.code !== 1001) {
        const savedToken = tokenRef.current;
        if (savedToken) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWithToken(savedToken);
          }, 3000);
        }
      }
    };

    ws.onerror = () => {
      isConnectingRef.current = false;
    };

    wsRef.current = ws;
  }, []);

  const login = useCallback(async (nickname: string, avatar?: File): Promise<{ success: boolean; error?: string; avatar?: string | null }> => {
    try {
      const formData = new FormData();
      formData.append('nickname', nickname);
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      const response = await fetch(`${API_URL}/api/login/${encodeURIComponent(nickname)}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem(NICKNAME_STORAGE_KEY, data.nickname);
      
      connectWithToken(data.token);
      
      return { success: true, avatar: data.avatar };
    } catch (error) {
      return { success: false, error: 'Nie można połączyć z serwerem' };
    }
  }, [connectWithToken]);

  const tryAutoLogin = useCallback((): { token: string; nickname: string } | null => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedNickname = localStorage.getItem(NICKNAME_STORAGE_KEY);
    
    if (savedToken && savedNickname) {
      connectWithToken(savedToken);
      return { token: savedToken, nickname: savedNickname };
    }
    return null;
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
    
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(NICKNAME_STORAGE_KEY);
  }, []);

  const sendMessage = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Room-specific methods
  const joinRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'JOIN_ROOM',
      payload: { roomId },
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const joinRoomByCode = useCallback((inviteCode: string) => {
    sendMessage({
      type: 'JOIN_ROOM_BY_CODE',
      payload: { inviteCode },
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({
      type: 'LEAVE_ROOM',
      payload: {},
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const createRoom = useCallback((options: {
    name: string;
    minBet: number;
    maxBet: number;
    roundDurationMs: number;
  }) => {
    sendMessage({
      type: 'CREATE_ROOM',
      payload: options,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const closeRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'CLOSE_ROOM',
      payload: { roomId },
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const getRooms = useCallback(() => {
    sendMessage({
      type: 'GET_ROOMS',
      payload: {},
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    login,
    disconnect,
    tryAutoLogin,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    createRoom,
    closeRoom,
    getRooms,
  };
}
