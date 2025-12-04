import { v4 as uuidv4 } from 'uuid';
import { Player, IPlayer } from '../models';
import { config } from '../config';
import { WebSocketService } from './WebSocketService';

export class GameService {
  private wsService: WebSocketService | null = null;

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  getConfig() {
    return {
      roundDurationMs: config.roundDurationMs,
      casinoCommissionPercent: config.casinoCommissionPercent,
      minBet: config.minBet,
      maxBet: config.maxBet,
    };
  }

  async createPlayer(username: string, avatar?: string, token?: string): Promise<IPlayer> {
    const player = new Player({
      id: uuidv4(),
      username,
      balance: 1000, // Starting balance
      avatar: avatar || null,
      token: token || null,
    });
    await player.save();
    return player;
  }

  async getPlayer(playerId: string): Promise<IPlayer | null> {
    return Player.findOne({ id: playerId });
  }

  async getPlayerByUsername(username: string): Promise<IPlayer | null> {
    return Player.findOne({ username });
  }

  async updatePlayerAvatar(username: string, avatar: string): Promise<IPlayer | null> {
    return Player.findOneAndUpdate(
      { username },
      { avatar },
      { new: true }
    );
  }

  async updatePlayerToken(username: string, token: string): Promise<IPlayer | null> {
    return Player.findOneAndUpdate(
      { username },
      { token },
      { new: true }
    );
  }

  async getAllPlayers(): Promise<IPlayer[]> {
    return Player.find({});
  }
}

export const gameService = new GameService();
