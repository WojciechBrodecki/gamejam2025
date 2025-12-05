import { WebSocket, WebSocketServer } from 'ws';
import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';
import jwt from 'jsonwebtoken';
import { gameService } from './GameService';
import { roomService } from './RoomService';
import { config } from '../config';

interface JwtPayload {
  nickname: string;
  iat: number;
  exp: number;
}

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  playerUsername?: string;
  roomId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();
  // Map of roomId -> Set of WebSocket clients in that room
  private roomClients: Map<string, Set<ExtendedWebSocket>> = new Map();
  // Map of playerId -> Set of WebSocket clients for that player (can have multiple connections)
  private playerClients: Map<string, Set<ExtendedWebSocket>> = new Map();

  constructor(server: Server) {
    // Use noServer mode for manual upgrade handling
    this.wss = new WebSocketServer({ noServer: true });
    this.init();
    this.setupUpgradeHandler(server);
  }

  private setupUpgradeHandler(server: Server): void {
    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = request.url || '';
      
      // Extract token from URL path: /ws/{token}
      const match = url.match(/^\/ws\/(.+)$/);
      
      if (!match) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const token = match[1];

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        
        // Attach nickname to request for later use
        (request as any).nickname = decoded.nickname;

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } catch (error) {
        console.error('JWT verification failed:', error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });
  }

  private init(): void {
    this.wss.on('connection', async (ws: ExtendedWebSocket, request: IncomingMessage) => {
      const nickname = (request as any).nickname;
      console.log(`New WebSocket connection established for user: ${nickname}`);
      
      ws.isAlive = true;
      this.clients.add(ws);

      // Auto-join the player using the nickname from JWT
      if (nickname) {
        await this.autoJoinPlayer(ws, nickname);
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendToClient(ws, {
            type: 'ERROR',
            payload: { message: 'Invalid message format', code: 'INVALID_FORMAT' },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason.toString()}`);
        this.handleDisconnect(ws);
      });

      ws.on('error', (error: Error & { code?: string }) => {
        // Ignore common WebSocket errors from invalid connections
        const ignoredCodes = ['WS_ERR_INVALID_CLOSE_CODE', 'WS_ERR_INVALID_UTF8', 'ECONNRESET'];
        if (error.code && ignoredCodes.includes(error.code)) {
          this.handleDisconnect(ws);
          return;
        }
        console.error('WebSocket error:', error.message);
        this.handleDisconnect(ws);
      });
      
      // Send a welcome message with available rooms and player's own rooms
      const publicRooms = await roomService.getPublicRooms();
      const playerCreatedRooms = ws.playerId ? await roomService.getPlayerCreatedRooms(ws.playerId) : [];
      
      this.sendToClient(ws, {
        type: 'CONNECTED',
        payload: { 
          message: 'WebSocket connection established', 
          username: nickname,
          playerId: ws.playerId,
          rooms: publicRooms.map(r => roomService.formatRoom(r)),
          myRooms: playerCreatedRooms.map(r => roomService.formatRoom(r)),
        },
        timestamp: Date.now(),
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.handleDisconnect(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleDisconnect(ws: ExtendedWebSocket): void {
    // Remove from room if in one
    if (ws.roomId) {
      const roomClients = this.roomClients.get(ws.roomId);
      if (roomClients) {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          this.roomClients.delete(ws.roomId);
        }
      }
    }

    // Remove from player clients map
    if (ws.playerId) {
      const playerSockets = this.playerClients.get(ws.playerId);
      if (playerSockets) {
        playerSockets.delete(ws);
        if (playerSockets.size === 0) {
          this.playerClients.delete(ws.playerId);
        }
      }
    }

    this.clients.delete(ws);
  }

  private async autoJoinPlayer(ws: ExtendedWebSocket, nickname: string): Promise<void> {
    let player = await gameService.getPlayerByUsername(nickname);
    
    if (!player) {
      player = await gameService.createPlayer(nickname);
    }

    ws.playerId = player.id;
    ws.playerUsername = player.username;

    // Track this connection for the player
    if (!this.playerClients.has(player.id)) {
      this.playerClients.set(player.id, new Set());
    }
    this.playerClients.get(player.id)!.add(ws);
  }

  private async handleMessage(ws: ExtendedWebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'JOIN_GAME':
        await this.handleJoinGame(ws, message.payload);
        break;
      case 'JOIN_ROOM':
        await this.handleJoinRoom(ws, message.payload);
        break;
      case 'JOIN_ROOM_BY_CODE':
        await this.handleJoinRoomByCode(ws, message.payload);
        break;
      case 'LEAVE_ROOM':
        await this.handleLeaveRoom(ws);
        break;
      case 'CREATE_ROOM':
        await this.handleCreateRoom(ws, message.payload);
        break;
      case 'CLOSE_ROOM':
        await this.handleCloseRoom(ws, message.payload);
        break;
      case 'PLACE_BET':
        await this.handlePlaceBet(ws, message.payload);
        break;
      case 'SYNC_STATE':
        await this.handleSyncState(ws);
        break;
      case 'GET_ROOMS':
        await this.handleGetRooms(ws);
        break;
      default:
        this.sendToClient(ws, {
          type: 'ERROR',
          payload: { message: 'Unknown message type', code: 'UNKNOWN_TYPE' },
          timestamp: Date.now(),
        });
    }
  }

  private async handleJoinGame(ws: ExtendedWebSocket, payload: { playerId?: string; username: string }): Promise<void> {
    let player;
    
    if (payload.playerId) {
      player = await gameService.getPlayer(payload.playerId);
    }
    
    if (!player) {
      // Check if username exists
      player = await gameService.getPlayerByUsername(payload.username);
      if (!player) {
        player = await gameService.createPlayer(payload.username);
      }
    }

    // Remove old player tracking if exists
    if (ws.playerId && ws.playerId !== player.id) {
      const oldPlayerSockets = this.playerClients.get(ws.playerId);
      if (oldPlayerSockets) {
        oldPlayerSockets.delete(ws);
        if (oldPlayerSockets.size === 0) {
          this.playerClients.delete(ws.playerId);
        }
      }
    }

    ws.playerId = player.id;
    ws.playerUsername = player.username;

    // Track this connection for the player
    if (!this.playerClients.has(player.id)) {
      this.playerClients.set(player.id, new Set());
    }
    this.playerClients.get(player.id)!.add(ws);

    // Send current state to the joining player
    await this.handleSyncState(ws);
  }

  private async handleCreateRoom(ws: ExtendedWebSocket, payload: {
    name: string;
    minBet: number;
    maxBet: number;
    roundDurationMs: number;
  }): Promise<void> {
    if (!ws.playerId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join the game first', code: 'NOT_JOINED' },
        timestamp: Date.now(),
      });
      return;
    }

    try {
      // Players can only create private rooms (always 2 players)
      const room = await roomService.createRoom({
        name: payload.name,
        minBet: payload.minBet,
        maxBet: payload.maxBet,
        roundDurationMs: payload.roundDurationMs,
        type: 'private',
        creatorId: ws.playerId,
      });

      // Auto-join the creator to the room's WebSocket channel
      ws.roomId = room.id;
      if (!this.roomClients.has(room.id)) {
        this.roomClients.set(room.id, new Set());
      }
      this.roomClients.get(room.id)!.add(ws);

      const currentRound = roomService.getCurrentRound(room.id);

      this.sendToClient(ws, {
        type: 'ROOM_CREATED',
        payload: {
          room: roomService.formatRoom(room),
          currentRound: currentRound ? {
            id: currentRound.id,
            startTime: currentRound.startTime,
            endTime: currentRound.endTime,
            totalPool: currentRound.totalPool,
            bets: currentRound.bets,
            status: currentRound.status,
          } : null,
          config: roomService.getRoomConfig(room),
        },
        timestamp: Date.now(),
      });

      // Private rooms are not broadcast to room list
    } catch (error) {
      console.error('Create room error:', error);
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'Failed to create room', code: 'CREATE_ROOM_FAILED' },
        timestamp: Date.now(),
      });
    }
  }

  private async handleCloseRoom(ws: ExtendedWebSocket, payload: { roomId: string }): Promise<void> {
    if (!ws.playerId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join the game first', code: 'NOT_JOINED' },
        timestamp: Date.now(),
      });
      return;
    }

    const result = await roomService.closeRoom(payload.roomId, ws.playerId);

    if (!result.success) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: result.message, code: 'CLOSE_ROOM_FAILED' },
        timestamp: Date.now(),
      });
      return;
    }

    // Clear room from WebSocket tracking
    this.roomClients.delete(payload.roomId);

    this.sendToClient(ws, {
      type: 'ROOM_CLOSED',
      payload: { roomId: payload.roomId, message: 'Room closed successfully' },
      timestamp: Date.now(),
    });
  }

  private async handleJoinRoom(ws: ExtendedWebSocket, payload: { roomId: string }): Promise<void> {
    if (!ws.playerId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join the game first', code: 'NOT_JOINED' },
        timestamp: Date.now(),
      });
      return;
    }

    // Leave current room's WS channel if in one (but don't leave the DB room)
    if (ws.roomId) {
      const roomClients = this.roomClients.get(ws.roomId);
      if (roomClients) {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          this.roomClients.delete(ws.roomId);
        }
      }
    }

    const result = await roomService.joinRoom(payload.roomId, ws.playerId);

    if (!result.success) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: result.message, code: 'JOIN_ROOM_FAILED' },
        timestamp: Date.now(),
      });
      return;
    }

    // Add to room's WebSocket channel
    ws.roomId = payload.roomId;
    if (!this.roomClients.has(payload.roomId)) {
      this.roomClients.set(payload.roomId, new Set());
    }
    this.roomClients.get(payload.roomId)!.add(ws);

    const room = result.room!;
    const currentRound = roomService.getCurrentRound(room.id);

    this.sendToClient(ws, {
      type: 'ROOM_JOINED',
      payload: {
        room: roomService.formatRoom(room),
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          totalPool: currentRound.totalPool,
          bets: currentRound.bets,
          status: currentRound.status,
        } : null,
        config: roomService.getRoomConfig(room),
        playerId: ws.playerId,
      },
      timestamp: Date.now(),
    });
  }

  private async handleJoinRoomByCode(ws: ExtendedWebSocket, payload: { inviteCode: string }): Promise<void> {
    if (!ws.playerId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join the game first', code: 'NOT_JOINED' },
        timestamp: Date.now(),
      });
      return;
    }

    // Leave current room's WS channel if in one
    if (ws.roomId) {
      const roomClients = this.roomClients.get(ws.roomId);
      if (roomClients) {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          this.roomClients.delete(ws.roomId);
        }
      }
    }

    const result = await roomService.joinRoomByInviteCode(payload.inviteCode, ws.playerId);

    if (!result.success) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: result.message, code: 'JOIN_ROOM_FAILED' },
        timestamp: Date.now(),
      });
      return;
    }

    const room = result.room!;

    // Add to room's WebSocket channel
    ws.roomId = room.id;
    if (!this.roomClients.has(room.id)) {
      this.roomClients.set(room.id, new Set());
    }
    this.roomClients.get(room.id)!.add(ws);

    const currentRound = roomService.getCurrentRound(room.id);

    this.sendToClient(ws, {
      type: 'ROOM_JOINED',
      payload: {
        room: roomService.formatRoom(room),
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          totalPool: currentRound.totalPool,
          bets: currentRound.bets,
          status: currentRound.status,
        } : null,
        config: roomService.getRoomConfig(room),
        playerId: ws.playerId,
      },
      timestamp: Date.now(),
    });
  }

  private async handleLeaveRoom(ws: ExtendedWebSocket, silent: boolean = false): Promise<void> {
    if (!ws.roomId || !ws.playerId) {
      if (!silent) {
        this.sendToClient(ws, {
          type: 'ERROR',
          payload: { message: 'Not in a room', code: 'NOT_IN_ROOM' },
          timestamp: Date.now(),
        });
      }
      return;
    }

    const roomId = ws.roomId;
    await roomService.leaveRoom(roomId, ws.playerId);

    // Remove from room's WebSocket channel
    const roomClients = this.roomClients.get(roomId);
    if (roomClients) {
      roomClients.delete(ws);
      if (roomClients.size === 0) {
        this.roomClients.delete(roomId);
      }
    }

    ws.roomId = undefined;

    if (!silent) {
      this.sendToClient(ws, {
        type: 'ROOM_LEFT',
        payload: { message: 'Left room successfully' },
        timestamp: Date.now(),
      });
    }
  }

  private async handlePlaceBet(ws: ExtendedWebSocket, payload: { amount: number }): Promise<void> {
    if (!ws.playerId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join the game first', code: 'NOT_JOINED' },
        timestamp: Date.now(),
      });
      return;
    }

    if (!ws.roomId) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'You must join a room first', code: 'NOT_IN_ROOM' },
        timestamp: Date.now(),
      });
      return;
    }

    const result = await roomService.placeBet(ws.roomId, ws.playerId, payload.amount);
    
    if (!result.success) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: result.message, code: 'BET_FAILED' },
        timestamp: Date.now(),
      });
    }
  }

  private async handleSyncState(ws: ExtendedWebSocket): Promise<void> {
    const globalConfig = gameService.getConfig();
    const publicRooms = await roomService.getPublicRooms();

    let roomData = null;
    if (ws.roomId) {
      const room = await roomService.getRoom(ws.roomId);
      if (room) {
        const currentRound = roomService.getCurrentRound(room.id);
        roomData = {
          room: roomService.formatRoom(room),
          currentRound: currentRound ? {
            id: currentRound.id,
            startTime: currentRound.startTime,
            endTime: currentRound.endTime,
            bets: currentRound.bets,
            totalPool: currentRound.totalPool,
            status: currentRound.status,
          } : null,
          config: roomService.getRoomConfig(room),
        };
      }
    }

    this.sendToClient(ws, {
      type: 'SYNC_STATE',
      payload: {
        globalConfig,
        playerId: ws.playerId,
        currentRoom: roomData,
        availableRooms: publicRooms.map(r => roomService.formatRoom(r)),
      },
      timestamp: Date.now(),
    });
  }

  private async handleGetRooms(ws: ExtendedWebSocket): Promise<void> {
    const publicRooms = await roomService.getPublicRooms();

    this.sendToClient(ws, {
      type: 'ROOMS_LIST',
      payload: {
        rooms: publicRooms.map(r => roomService.formatRoom(r)),
      },
      timestamp: Date.now(),
    });
  }

  // Broadcast to all connected clients
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Broadcast to all clients in a specific room
  broadcastToRoom(roomId: string, message: any): void {
    const data = JSON.stringify(message);
    const roomClients = this.roomClients.get(roomId);
    
    if (!roomClients) return;

    roomClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Send message to all connections of a specific player (by playerId)
  sendToPlayer(playerId: string, message: any): void {
    const data = JSON.stringify(message);
    const playerSockets = this.playerClients.get(playerId);
    
    if (!playerSockets) return;

    playerSockets.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
