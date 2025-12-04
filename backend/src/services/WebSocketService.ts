import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { gameService } from './GameService';

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  playerUsername?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.init();
  }

  private init(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      console.log('New WebSocket connection');
      ws.isAlive = true;
      this.clients.add(ws);

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

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
        
        if (ws.playerId) {
          this.broadcast({
            type: 'PLAYER_LEFT',
            payload: { playerId: ws.playerId, username: ws.playerUsername },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
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
