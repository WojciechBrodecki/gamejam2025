import { WebSocket, WebSocketServer } from 'ws';
import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';
import jwt from 'jsonwebtoken';
import { gameService } from './GameService';
import { config } from '../config';

interface JwtPayload {
  nickname: string;
  iat: number;
  exp: number;
}

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  playerUsername?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();

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
        this.clients.delete(ws);
        
        if (ws.playerId) {
          this.broadcast({
            type: 'PLAYER_LEFT',
            payload: { playerId: ws.playerId, username: ws.playerUsername },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('error', (error: Error & { code?: string }) => {
        // Ignore common WebSocket errors from invalid connections
        const ignoredCodes = ['WS_ERR_INVALID_CLOSE_CODE', 'WS_ERR_INVALID_UTF8', 'ECONNRESET'];
        if (error.code && ignoredCodes.includes(error.code)) {
          // Silently ignore these errors - they're from invalid HTTP connections
          this.clients.delete(ws);
          return;
        }
        console.error('WebSocket error:', error.message);
        this.clients.delete(ws);
      });
      
      // Send a welcome message to confirm connection is stable
      const currentRound = gameService.getCurrentRound();
      this.sendToClient(ws, {
        type: 'CONNECTED',
        payload: { 
          message: 'WebSocket connection established', 
          username: nickname,
          round: currentRound ? {
            id: currentRound.id,
            startTime: currentRound.startTime,
            endTime: currentRound.endTime,
            totalPool: currentRound.totalPool,
            bets: currentRound.bets,
            status: currentRound.status,
          } : null,
        },
        timestamp: Date.now(),
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private async autoJoinPlayer(ws: ExtendedWebSocket, nickname: string): Promise<void> {
    let player = await gameService.getPlayerByUsername(nickname);
    
    if (!player) {
      player = await gameService.createPlayer(nickname);
    }

    ws.playerId = player.id;
    ws.playerUsername = player.username;

    // Broadcast player joined
    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: { 
        playerId: player.id, 
        username: player.username,
        balance: player.balance,
        avatar: player.avatar || null,
      },
      timestamp: Date.now(),
    });

    // Send current state to the joining player
    await this.handleSyncState(ws);
  }

  private async handleMessage(ws: ExtendedWebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'JOIN_GAME':
        await this.handleJoinGame(ws, message.payload);
        break;
      case 'PLACE_BET':
        await this.handlePlaceBet(ws, message.payload);
        break;
      case 'SYNC_STATE':
        await this.handleSyncState(ws);
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

    ws.playerId = player.id;
    ws.playerUsername = player.username;

    // Broadcast player joined
    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: { 
        playerId: player.id, 
        username: player.username,
        balance: player.balance,
      },
      timestamp: Date.now(),
    });

    // Send current state to the joining player
    await this.handleSyncState(ws);
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

    const result = await gameService.placeBet(ws.playerId, payload.amount);
    
    if (!result.success) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: result.message, code: 'BET_FAILED' },
        timestamp: Date.now(),
      });
    }
  }

  private async handleSyncState(ws: ExtendedWebSocket): Promise<void> {
    const currentRound = gameService.getCurrentRound();
    const config = gameService.getConfig();
    const players = await gameService.getAllPlayers();

    this.sendToClient(ws, {
      type: 'SYNC_STATE',
      payload: {
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          bets: currentRound.bets,
          totalPool: currentRound.totalPool,
          status: currentRound.status,
        } : null,
        config,
        players: players.map(p => ({
          id: p.id,
          username: p.username,
          balance: p.balance,
          avatar: p.avatar || null,
        })),
        playerId: ws.playerId,
      },
      timestamp: Date.now(),
    });
  }

  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
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
