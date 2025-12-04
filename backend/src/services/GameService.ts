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

  // Create a waiting round that collects bets until 2 players bet
  async createWaitingRound(): Promise<IRound> {
    const round = new Round({
      id: uuidv4(),
      startTime: null,
      endTime: null,
      bets: [],
      totalPool: 0,
      status: 'waiting',
    });

    await round.save();
    this.currentRound = round;

    // Broadcast waiting round created
    this.wsService?.broadcast({
      type: 'ROUND_WAITING',
      payload: {
        round: this.formatRound(round),
        message: 'Waiting for at least 2 players to place bets',
      },
      timestamp: Date.now(),
    });

    console.log(`Waiting round created: ${round.id}`);
    return round;
  }

  // Start the round timer (called when 2 players have bet)
  private async activateRound(): Promise<void> {
    if (!this.currentRound || this.currentRound.status !== 'waiting') {
      return;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + config.roundDurationMs);

    this.currentRound.startTime = now;
    this.currentRound.endTime = endTime;
    this.currentRound.status = 'active';
    await this.currentRound.save();

    // Broadcast round start
    this.wsService?.broadcast({
      type: 'ROUND_START',
      payload: {
        round: this.formatRound(this.currentRound),
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

    console.log(`Round activated: ${this.currentRound.id}`);
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
    const updateInterval = setInterval(async () => {
      if (!this.currentRound || this.currentRound.status === 'finished' || !this.currentRound.endTime) {
        clearInterval(updateInterval);
        return;
      }

      const timeRemaining = Math.max(0, this.currentRound.endTime.getTime() - Date.now());
      
      // Get unique players who placed bets
      const bettingPlayers = await this.getBettingPlayers();
      
      this.wsService?.broadcast({
        type: 'ROUND_UPDATE',
        payload: {
          round: this.formatRound(this.currentRound),
          timeRemaining,
          players: bettingPlayers,
        },
        timestamp: Date.now(),
      });

      if (timeRemaining <= 0) {
        clearInterval(updateInterval);
      }
    }, 1000);
  }

  private async getBettingPlayers(): Promise<{ id: string; username: string; avatar: string | null; totalBet: number }[]> {
    if (!this.currentRound) return [];

    // Aggregate bets by player
    const playerBets = new Map<string, { username: string; totalBet: number }>();
    for (const bet of this.currentRound.bets) {
      const existing = playerBets.get(bet.playerId);
      if (existing) {
        existing.totalBet += bet.amount;
      } else {
        playerBets.set(bet.playerId, { username: bet.playerUsername, totalBet: bet.amount });
      }
    }

    // Fetch player details (for avatar)
    const players: { id: string; username: string; avatar: string | null; totalBet: number }[] = [];
    for (const [playerId, data] of playerBets) {
      const player = await Player.findOne({ id: playerId });
      players.push({
        id: playerId,
        username: data.username,
        avatar: player?.avatar || null,
        totalBet: data.totalBet,
      });
    }

    return players;
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

    // Check if we should activate the round (2 unique players have bet)
    if (this.currentRound.status === 'waiting') {
      const uniquePlayers = new Set(this.currentRound.bets.map(b => b.playerId));
      if (uniquePlayers.size >= 2) {
        await this.activateRound();
      }
    }

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
      let balanceBefore = 0;
      let balanceAfter = 0;
      if (winnerPlayer) {
        balanceBefore = winnerPlayer.balance;
        winnerPlayer.balance += winnerAmount;
        balanceAfter = winnerPlayer.balance;
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
          winningNumber: winner.winningNumber,
        },
        timestamp: Date.now(),
      });

      console.log(`\n🎉 ========== WINNER ==========`);
      console.log(`🏆 Player: ${winner.playerUsername}`);
      console.log(`💰 Won: ${winnerAmount}`);
      console.log(`💵 Balance before: ${balanceBefore}`);
      console.log(`💵 Balance after: ${balanceAfter}`);
      console.log(`🎲 Winning number: ${winner.winningNumber}`);
      console.log(`📊 Total pool: ${this.currentRound.totalPool}`);
      console.log(`==============================\n`);
    } else {
      console.log('Round ended with no bets');
    }

    await this.currentRound.save();
    this.currentRound = null;

    // Create new waiting round after short delay
    setTimeout(() => {
      this.createWaitingRound();
    }, 5000);
  }

  private selectWinner(bets: { playerId: string; playerUsername: string; amount: number }[]): { playerId: string; playerUsername: string; winningNumber: number } {
    // Create weighted pool based on bet amounts
    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winningNumber = Math.random() * totalPool;
    
    let cumulative = 0;
    for (const bet of bets) {
      cumulative += bet.amount;
      if (winningNumber <= cumulative) {
        return { playerId: bet.playerId, playerUsername: bet.playerUsername, winningNumber };
      }
    }

    // Fallback (should never happen)
    return { playerId: bets[0].playerId, playerUsername: bets[0].playerUsername, winningNumber };
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

  async createPlayer(username: string, avatar?: string): Promise<IPlayer> {
    const player = new Player({
      id: uuidv4(),
      username,
      balance: 1000, // Starting balance
      avatar: avatar || null,
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

  async getAllPlayers(): Promise<IPlayer[]> {
    return Player.find({});
  }
}

export const gameService = new GameService();
