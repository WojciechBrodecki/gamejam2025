import { v4 as uuidv4 } from 'uuid';
import { Round, IRound, Player, IPlayer } from '../models';
import { config } from '../config';
import { WebSocketService } from './WebSocketService';

export class GameService {
  private currentRound: IRound | null = null;
  private roundTimer: NodeJS.Timeout | null = null;
  private wsService: WebSocketService | null = null;

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  async startNewRound(): Promise<IRound> {
    const now = new Date();
    const endTime = new Date(now.getTime() + config.roundDurationMs);

    const round = new Round({
      id: uuidv4(),
      startTime: now,
      endTime: endTime,
      bets: [],
      totalPool: 0,
      status: 'active',
    });

    await round.save();
    this.currentRound = round;

    // Broadcast round start
    this.wsService?.broadcast({
      type: 'ROUND_START',
      payload: {
        round: this.formatRound(round),
        timeRemaining: config.roundDurationMs,
      },
      timestamp: Date.now(),
    });

    // Set timer for round end
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, config.roundDurationMs);

    // Send updates every second
    this.startRoundUpdates();

    console.log(`New round started: ${round.id}`);
    return round;
  }

  private startRoundUpdates(): void {
    const updateInterval = setInterval(() => {
      if (!this.currentRound || this.currentRound.status === 'finished') {
        clearInterval(updateInterval);
        return;
      }

      const timeRemaining = Math.max(0, this.currentRound.endTime.getTime() - Date.now());
      
      this.wsService?.broadcast({
        type: 'ROUND_UPDATE',
        payload: {
          round: this.formatRound(this.currentRound),
          timeRemaining,
        },
        timestamp: Date.now(),
      });

      if (timeRemaining <= 0) {
        clearInterval(updateInterval);
      }
    }, 1000);
  }

  async placeBet(playerId: string, amount: number): Promise<{ success: boolean; message: string }> {
    if (!this.currentRound || this.currentRound.status === 'finished') {
      return { success: false, message: 'No active round' };
    }

    if (amount < config.minBet || amount > config.maxBet) {
      return { success: false, message: `Bet must be between ${config.minBet} and ${config.maxBet}` };
    }

    const player = await Player.findOne({ id: playerId });
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (player.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    // Deduct from player balance
    player.balance -= amount;
    await player.save();

    // Add bet to round
    const bet = {
      playerId: player.id,
      playerUsername: player.username,
      amount,
      timestamp: new Date(),
    };

    this.currentRound.bets.push(bet);
    this.currentRound.totalPool += amount;
    await this.currentRound.save();

    // Broadcast bet placed
    this.wsService?.broadcast({
      type: 'BET_PLACED',
      payload: {
        bet,
        round: this.formatRound(this.currentRound),
      },
      timestamp: Date.now(),
    });

    console.log(`Bet placed: ${player.username} - ${amount}`);
    return { success: true, message: 'Bet placed successfully' };
  }

  async endRound(): Promise<void> {
    if (!this.currentRound) {
      return;
    }

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    this.currentRound.status = 'finished';

    if (this.currentRound.bets.length > 0) {
      // Select winner based on weighted random (more bets = higher chance)
      const winner = this.selectWinner(this.currentRound.bets);
      
      // Calculate commission and winnings
      const commission = (this.currentRound.totalPool * config.casinoCommissionPercent) / 100;
      const winnerAmount = this.currentRound.totalPool - commission;

      this.currentRound.winnerId = winner.playerId;
      this.currentRound.winnerUsername = winner.playerUsername;
      this.currentRound.winnerAmount = winnerAmount;
      this.currentRound.casinoCommission = commission;

      // Credit winner
      const winnerPlayer = await Player.findOne({ id: winner.playerId });
      if (winnerPlayer) {
        winnerPlayer.balance += winnerAmount;
        await winnerPlayer.save();
      }

      // Broadcast round end
      this.wsService?.broadcast({
        type: 'ROUND_END',
        payload: {
          round: this.formatRound(this.currentRound),
          winner: {
            playerId: winner.playerId,
            username: winner.playerUsername,
            amountWon: winnerAmount,
          },
        },
        timestamp: Date.now(),
      });

      console.log(`Round ended. Winner: ${winner.playerUsername} - Won: ${winnerAmount}`);
    } else {
      console.log('Round ended with no bets');
    }

    await this.currentRound.save();
    this.currentRound = null;

    // Start new round after short delay
    setTimeout(() => {
      this.startNewRound();
    }, 5000);
  }

  private selectWinner(bets: { playerId: string; playerUsername: string; amount: number }[]): { playerId: string; playerUsername: string } {
    // Create weighted pool based on bet amounts
    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const random = Math.random() * totalPool;
    
    let cumulative = 0;
    for (const bet of bets) {
      cumulative += bet.amount;
      if (random <= cumulative) {
        return { playerId: bet.playerId, playerUsername: bet.playerUsername };
      }
    }

    // Fallback (should never happen)
    return { playerId: bets[0].playerId, playerUsername: bets[0].playerUsername };
  }

  getCurrentRound(): IRound | null {
    return this.currentRound;
  }

  getConfig() {
    return {
      roundDurationMs: config.roundDurationMs,
      casinoCommissionPercent: config.casinoCommissionPercent,
      minBet: config.minBet,
      maxBet: config.maxBet,
    };
  }

  private formatRound(round: IRound) {
    return {
      id: round.id,
      startTime: round.startTime,
      endTime: round.endTime,
      bets: round.bets,
      totalPool: round.totalPool,
      winnerId: round.winnerId,
      winnerUsername: round.winnerUsername,
      winnerAmount: round.winnerAmount,
      casinoCommission: round.casinoCommission,
      status: round.status,
    };
  }

  async createPlayer(username: string): Promise<IPlayer> {
    const player = new Player({
      id: uuidv4(),
      username,
      balance: 1000, // Starting balance
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

  async getAllPlayers(): Promise<IPlayer[]> {
    return Player.find({});
  }
}

export const gameService = new GameService();
