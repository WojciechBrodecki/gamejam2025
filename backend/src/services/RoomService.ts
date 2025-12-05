import { v4 as uuidv4 } from 'uuid';
import { Room, IRoom, RoomType, Player, Round, IRound } from '../models';
import { config } from '../config';
import { WebSocketService } from './WebSocketService';

export interface CreateRoomOptions {
  name: string;
  minBet: number;
  maxBet: number;
  roundDurationMs: number;
  type: RoomType;
  creatorId: string;
}

export interface DefaultRoomConfig {
  name: string;
  minBet: number;
  maxBet: number;
  maxPlayers: number;
  roundDurationMs: number;
}

export interface RoomRoundState {
  currentRound: IRound | null;
  roundTimer: NodeJS.Timeout | null;
  updateInterval: NodeJS.Timeout | null;
}

export class RoomService {
  private wsService: WebSocketService | null = null;
  // In-memory state for each room's round (roomId -> state)
  private roomStates: Map<string, RoomRoundState> = new Map();
  // IDs of default public rooms (cannot be closed)
  private defaultRoomIds: Set<string> = new Set();

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create default public rooms on server startup
  async ensureDefaultRooms(defaultRooms: DefaultRoomConfig[]): Promise<void> {
    for (const roomConfig of defaultRooms) {
      // Check if room with this name already exists
      let room = await Room.findOne({ name: roomConfig.name, type: 'public' });
      
      if (!room) {
        // Create new default public room
        const roomId = uuidv4();
        room = new Room({
          id: roomId,
          name: roomConfig.name,
          maxPlayers: roomConfig.maxPlayers,
          minBet: roomConfig.minBet,
          maxBet: roomConfig.maxBet,
          roundDurationMs: roomConfig.roundDurationMs,
          type: 'public',
          creatorId: 'SYSTEM', // System-created room
          playerIds: [],
          status: 'waiting',
        });
        await room.save();
        console.log(`Created default public room: ${roomConfig.name} (round: ${roomConfig.roundDurationMs / 1000}s)`);
      } else {
        // Ensure room is not closed
        if (room.status === 'closed') {
          room.status = 'waiting';
          await room.save();
        }
        console.log(`Default public room already exists: ${roomConfig.name}`);
      }

      // Track as default room
      this.defaultRoomIds.add(room.id);

      // Initialize room state
      if (!this.roomStates.has(room.id)) {
        this.roomStates.set(room.id, {
          currentRound: null,
          roundTimer: null,
          updateInterval: null,
        });
      }

      // Create waiting round if not exists
      if (!this.getCurrentRound(room.id)) {
        await this.createWaitingRound(room.id);
      }
    }
  }

  async createRoom(options: CreateRoomOptions): Promise<IRoom> {
    // Players can only create private rooms
    if (options.type !== 'private') {
      throw new Error('Players can only create private rooms');
    }

    // Check if player has reached max private rooms limit
    const playerRoomsCount = await this.getPlayerActiveRoomsCount(options.creatorId);
    if (playerRoomsCount >= config.maxPrivateRoomsPerPlayer) {
      throw new Error(`You can only have ${config.maxPrivateRoomsPerPlayer} active private rooms at a time`);
    }

    const roomId = uuidv4();
    
    // Private rooms always have exactly 2 players
    const room = new Room({
      id: roomId,
      name: options.name,
      maxPlayers: 2, // Private rooms are always 1v1
      minBet: options.minBet,
      maxBet: options.maxBet,
      roundDurationMs: options.roundDurationMs,
      type: 'private',
      inviteCode: this.generateInviteCode(),
      creatorId: options.creatorId,
      playerIds: [options.creatorId], // Creator auto-joins
      status: 'waiting',
    });

    await room.save();

    // Initialize room state
    this.roomStates.set(roomId, {
      currentRound: null,
      roundTimer: null,
      updateInterval: null,
    });

    // Create initial waiting round for this room
    await this.createWaitingRound(roomId);

    console.log(`Private room created: ${room.name} (${room.id}) by ${options.creatorId}`);
    return room;
  }

  async getRoom(roomId: string): Promise<IRoom | null> {
    return Room.findOne({ id: roomId });
  }

  async getRoomByInviteCode(inviteCode: string): Promise<IRoom | null> {
    return Room.findOne({ inviteCode, type: 'private', status: { $ne: 'closed' } });
  }

  async getPublicRooms(): Promise<IRoom[]> {
    return Room.find({ type: 'public', status: { $ne: 'closed' } })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getAllActiveRooms(): Promise<IRoom[]> {
    return Room.find({ status: { $ne: 'closed' } }).sort({ createdAt: -1 });
  }

  async joinRoom(roomId: string, playerId: string): Promise<{ success: boolean; message: string; room?: IRoom }> {
    const room = await Room.findOne({ id: roomId });
    
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.status === 'closed') {
      return { success: false, message: 'Room is closed' };
    }

    if (room.playerIds.includes(playerId)) {
      return { success: true, message: 'Already in room', room };
    }

    // No limit on joining - maxPlayers limits betters, not spectators
    room.playerIds.push(playerId);
    await room.save();

    // Broadcast player joined to room
    const player = await Player.findOne({ id: playerId });
    this.wsService?.broadcastToRoom(roomId, {
      type: 'PLAYER_JOINED_ROOM',
      payload: {
        roomId,
        playerId,
        username: player?.username || 'Unknown',
        playerCount: room.playerIds.length,
      },
      timestamp: Date.now(),
    });

    console.log(`Player ${playerId} joined room ${room.name}`);
    return { success: true, message: 'Joined room', room };
  }

  async joinRoomByInviteCode(inviteCode: string, playerId: string): Promise<{ success: boolean; message: string; room?: IRoom }> {
    const room = await this.getRoomByInviteCode(inviteCode);
    
    if (!room) {
      return { success: false, message: 'Invalid invite code or room not found' };
    }

    return this.joinRoom(room.id, playerId);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<{ success: boolean; message: string }> {
    const room = await Room.findOne({ id: roomId });
    
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const playerIndex = room.playerIds.indexOf(playerId);
    if (playerIndex === -1) {
      return { success: false, message: 'Not in room' };
    }

    room.playerIds.splice(playerIndex, 1);

    // Only close private rooms when empty (public rooms stay open)
    if (room.playerIds.length === 0 && room.type === 'private') {
      room.status = 'closed';
      this.cleanupRoomState(roomId);
    }

    await room.save();

    // Broadcast player left to room
    const player = await Player.findOne({ id: playerId });
    this.wsService?.broadcastToRoom(roomId, {
      type: 'PLAYER_LEFT_ROOM',
      payload: {
        roomId,
        playerId,
        username: player?.username || 'Unknown',
        playerCount: room.playerIds.length,
      },
      timestamp: Date.now(),
    });

    console.log(`Player ${playerId} left room ${room.name}`);
    return { success: true, message: 'Left room' };
  }

  async closeRoom(roomId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    const room = await Room.findOne({ id: roomId });
    
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    // Cannot close default public rooms
    if (this.defaultRoomIds.has(roomId)) {
      return { success: false, message: 'Cannot close default public rooms' };
    }

    // Cannot close public rooms (only private)
    if (room.type === 'public') {
      return { success: false, message: 'Cannot close public rooms' };
    }

    if (room.creatorId !== requesterId) {
      return { success: false, message: 'Only room creator can close the room' };
    }

    room.status = 'closed';
    await room.save();

    this.cleanupRoomState(roomId);

    // Broadcast room closed
    this.wsService?.broadcastToRoom(roomId, {
      type: 'ROOM_CLOSED',
      payload: { roomId, message: 'Room has been closed' },
      timestamp: Date.now(),
    });

    console.log(`Room ${room.name} closed by ${requesterId}`);
    return { success: true, message: 'Room closed' };
  }

  isDefaultRoom(roomId: string): boolean {
    return this.defaultRoomIds.has(roomId);
  }

  private cleanupRoomState(roomId: string): void {
    const state = this.roomStates.get(roomId);
    if (state) {
      if (state.roundTimer) clearTimeout(state.roundTimer);
      if (state.updateInterval) clearInterval(state.updateInterval);
      this.roomStates.delete(roomId);
    }
  }

  // ==================== Round Management per Room ====================

  async createWaitingRound(roomId: string): Promise<IRound | null> {
    const room = await Room.findOne({ id: roomId });
    if (!room || room.status === 'closed') return null;

    const round = new Round({
      id: uuidv4(),
      startTime: null,
      endTime: null,
      bets: [],
      totalPool: 0,
      status: 'waiting',
    });

    await round.save();

    // Update room state
    let state = this.roomStates.get(roomId);
    if (!state) {
      state = { currentRound: null, roundTimer: null, updateInterval: null };
      this.roomStates.set(roomId, state);
    }
    state.currentRound = round;

    // Update room with current round ID
    room.currentRoundId = round.id;
    await room.save();

    // Broadcast waiting round created to room
    this.wsService?.broadcastToRoom(roomId, {
      type: 'ROUND_WAITING',
      payload: {
        roomId,
        round: this.formatRound(round),
        message: 'Waiting for at least 2 players to place bets',
      },
      timestamp: Date.now(),
    });

    console.log(`Waiting round created for room ${room.name}: ${round.id}`);
    return round;
  }

  async activateRound(roomId: string): Promise<void> {
    const state = this.roomStates.get(roomId);
    if (!state || !state.currentRound || state.currentRound.status !== 'waiting') {
      return;
    }

    const room = await Room.findOne({ id: roomId });
    if (!room) return;

    // Use room-specific round duration
    const roundDuration = room.roundDurationMs;

    const now = new Date();
    const endTime = new Date(now.getTime() + roundDuration);

    state.currentRound.startTime = now;
    state.currentRound.endTime = endTime;
    state.currentRound.status = 'active';
    await state.currentRound.save();

    room.status = 'active';
    await room.save();

    // Broadcast round start to room
    this.wsService?.broadcastToRoom(roomId, {
      type: 'ROUND_START',
      payload: {
        roomId,
        round: this.formatRound(state.currentRound),
        timeRemaining: roundDuration,
      },
      timestamp: Date.now(),
    });

    // Set timer for round end
    state.roundTimer = setTimeout(() => {
      this.endRound(roomId);
    }, roundDuration);

    // Start round updates
    this.startRoundUpdates(roomId);

    console.log(`Round activated for room ${room.name}: ${state.currentRound.id} (duration: ${roundDuration / 1000}s)`);
  }

  private startRoundUpdates(roomId: string): void {
    const state = this.roomStates.get(roomId);
    if (!state) return;

    state.updateInterval = setInterval(async () => {
      const currentState = this.roomStates.get(roomId);
      if (!currentState || !currentState.currentRound || 
          currentState.currentRound.status === 'finished' || 
          !currentState.currentRound.endTime) {
        if (state.updateInterval) {
          clearInterval(state.updateInterval);
          state.updateInterval = null;
        }
        return;
      }

      const timeRemaining = Math.max(0, currentState.currentRound.endTime.getTime() - Date.now());
      
      // Get unique players who placed bets
      const bettingPlayers = await this.getBettingPlayers(roomId);
      
      this.wsService?.broadcastToRoom(roomId, {
        type: 'ROUND_UPDATE',
        payload: {
          roomId,
          round: this.formatRound(currentState.currentRound),
          timeRemaining,
          players: bettingPlayers,
        },
        timestamp: Date.now(),
      });

      if (timeRemaining <= 0) {
        if (state.updateInterval) {
          clearInterval(state.updateInterval);
          state.updateInterval = null;
        }
      }
    }, 1000);
  }

  private async getBettingPlayers(roomId: string): Promise<{ id: string; username: string; avatar: string | null; totalBet: number }[]> {
    const state = this.roomStates.get(roomId);
    if (!state || !state.currentRound) return [];

    // Aggregate bets by player
    const playerBets = new Map<string, { username: string; totalBet: number }>();
    for (const bet of state.currentRound.bets) {
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

  async placeBet(roomId: string, playerId: string, amount: number): Promise<{ success: boolean; message: string }> {
    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (!room.playerIds.includes(playerId)) {
      return { success: false, message: 'You are not in this room' };
    }

    const state = this.roomStates.get(roomId);
    if (!state || !state.currentRound || state.currentRound.status === 'finished') {
      return { success: false, message: 'No active round in this room' };
    }

    // Check if player limit for betters has been reached
    const uniqueBetterIds = new Set(state.currentRound.bets.map(b => b.playerId));
    const playerAlreadyBet = uniqueBetterIds.has(playerId);
    
    if (!playerAlreadyBet && uniqueBetterIds.size >= room.maxPlayers) {
      return { success: false, message: `Maximum ${room.maxPlayers} players can bet in this round` };
    }

    // Check minimum bet per single bet
    if (amount < room.minBet) {
      return { success: false, message: `Single bet must be at least ${room.minBet}` };
    }

    // Calculate current total bets for this player in this round
    const currentPlayerTotalBets = state.currentRound.bets
      .filter(b => b.playerId === playerId)
      .reduce((sum, b) => sum + b.amount, 0);

    // Check if new bet would exceed max total bet limit
    if (currentPlayerTotalBets + amount > room.maxBet) {
      const remaining = room.maxBet - currentPlayerTotalBets;
      if (remaining <= 0) {
        return { success: false, message: `You have reached the maximum bet limit of ${room.maxBet}` };
      }
      return { success: false, message: `You can only bet up to ${remaining} more (max total: ${room.maxBet})` };
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

    state.currentRound.bets.push(bet);
    state.currentRound.totalPool += amount;
    await state.currentRound.save();

    // Broadcast bet placed to room
    this.wsService?.broadcastToRoom(roomId, {
      type: 'BET_PLACED',
      payload: {
        roomId,
        bet,
        round: this.formatRound(state.currentRound),
      },
      timestamp: Date.now(),
    });

    console.log(`Bet placed in room ${room.name}: ${player.username} - ${amount}`);

    // Check if we should activate the round (2 unique players have bet)
    if (state.currentRound.status === 'waiting') {
      const uniquePlayers = new Set(state.currentRound.bets.map(b => b.playerId));
      if (uniquePlayers.size >= 2) {
        await this.activateRound(roomId);
      }
    }

    return { success: true, message: 'Bet placed successfully' };
  }

  async endRound(roomId: string): Promise<void> {
    const state = this.roomStates.get(roomId);
    if (!state || !state.currentRound) return;

    const room = await Room.findOne({ id: roomId });
    if (!room) return;

    if (state.roundTimer) {
      clearTimeout(state.roundTimer);
      state.roundTimer = null;
    }

    if (state.updateInterval) {
      clearInterval(state.updateInterval);
      state.updateInterval = null;
    }

    state.currentRound.status = 'finished';

    if (state.currentRound.bets.length > 0) {
      // Select winner based on weighted random
      const winner = this.selectWinner(state.currentRound.bets);
      
      // Calculate commission and winnings
      const commission = (state.currentRound.totalPool * config.casinoCommissionPercent) / 100;
      const winnerAmount = state.currentRound.totalPool - commission;

      state.currentRound.winnerId = winner.playerId;
      state.currentRound.winnerUsername = winner.playerUsername;
      state.currentRound.winnerAmount = winnerAmount;
      state.currentRound.casinoCommission = commission;

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

      // Calculate each player's total bet and loss/win
      const playerTotalBets = new Map<string, number>();
      for (const bet of state.currentRound.bets) {
        const current = playerTotalBets.get(bet.playerId) || 0;
        playerTotalBets.set(bet.playerId, current + bet.amount);
      }

      // Broadcast round end to room (for clients currently viewing the room)
      this.wsService?.broadcastToRoom(roomId, {
        type: 'ROUND_END',
        payload: {
          roomId,
          roomName: room.name,
          round: this.formatRound(state.currentRound),
          winner: {
            playerId: winner.playerId,
            username: winner.playerUsername,
            amountWon: winnerAmount,
          },
          winningNumber: winner.winningNumber,
        },
        timestamp: Date.now(),
      });

      // Send personal notifications to all players who placed bets
      const uniqueBetterIds = [...playerTotalBets.keys()];
      for (const betterId of uniqueBetterIds) {
        const totalBet = playerTotalBets.get(betterId) || 0;
        const isWinner = betterId === winner.playerId;
        
        // Get updated balance
        const betterPlayer = await Player.findOne({ id: betterId });
        const currentBalance = betterPlayer?.balance || 0;

        this.wsService?.sendToPlayer(betterId, {
          type: 'ROUND_RESULT_NOTIFICATION',
          payload: {
            roomId,
            roomName: room.name,
            roundId: state.currentRound.id,
            isWinner,
            totalBet,
            amountWon: isWinner ? winnerAmount : 0,
            amountLost: isWinner ? 0 : totalBet,
            netResult: isWinner ? (winnerAmount - totalBet) : -totalBet,
            winnerUsername: winner.playerUsername,
            totalPool: state.currentRound.totalPool,
            currentBalance,
          },
          timestamp: Date.now(),
        });
      }

      console.log(`\n🎉 ========== WINNER (Room: ${room.name}) ==========`);
      console.log(`🏆 Player: ${winner.playerUsername}`);
      console.log(`💰 Won: ${winnerAmount}`);
      console.log(`💵 Balance before: ${balanceBefore}`);
      console.log(`💵 Balance after: ${balanceAfter}`);
      console.log(`🎲 Winning number: ${winner.winningNumber}`);
      console.log(`📊 Total pool: ${state.currentRound.totalPool}`);
      console.log(`==============================================\n`);
    } else {
      console.log(`Round ended with no bets in room ${room.name}`);
    }

    await state.currentRound.save();
    state.currentRound = null;

    // Set room back to waiting
    room.status = 'waiting';
    await room.save();

    // Create new waiting round after configured delay
    setTimeout(() => {
      this.createWaitingRound(roomId);
    }, config.roundDelayMs);
  }

  private selectWinner(bets: { playerId: string; playerUsername: string; amount: number }[]): { playerId: string; playerUsername: string; winningNumber: number } {
    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winningNumber = Math.random() * totalPool;
    
    let cumulative = 0;
    for (const bet of bets) {
      cumulative += bet.amount;
      if (winningNumber <= cumulative) {
        return { playerId: bet.playerId, playerUsername: bet.playerUsername, winningNumber };
      }
    }

    return { playerId: bets[0].playerId, playerUsername: bets[0].playerUsername, winningNumber };
  }

  getCurrentRound(roomId: string): IRound | null {
    return this.roomStates.get(roomId)?.currentRound || null;
  }

  getRoomConfig(room: IRoom) {
    return {
      roomId: room.id,
      roomName: room.name,
      roundDurationMs: room.roundDurationMs,
      casinoCommissionPercent: config.casinoCommissionPercent,
      minBet: room.minBet,
      maxBet: room.maxBet,
      maxPlayers: room.maxPlayers,
      type: room.type,
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

  formatRoom(room: IRoom) {
    // Get number of unique betters in current round
    const state = this.roomStates.get(room.id);
    const currentRoundBetterCount = state?.currentRound 
      ? new Set(state.currentRound.bets.map(b => b.playerId)).size 
      : 0;

    return {
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers, // Max betters per round
      minBet: room.minBet,
      maxBet: room.maxBet,
      roundDurationMs: room.roundDurationMs,
      type: room.type,
      inviteCode: room.inviteCode,
      creatorId: room.creatorId,
      playerCount: room.playerIds.length, // People in room (spectators + players)
      currentBetterCount: currentRoundBetterCount, // Players who bet in current round
      status: room.status,
      createdAt: room.createdAt,
    };
  }

  // Get all active private rooms created by a specific player
  async getPlayerCreatedRooms(playerId: string): Promise<IRoom[]> {
    return Room.find({ 
      creatorId: playerId, 
      type: 'private',
      status: { $ne: 'closed' } 
    }).sort({ createdAt: -1 });
  }

  // Get all active private rooms that player has joined (but not created)
  async getPlayerJoinedRooms(playerId: string): Promise<IRoom[]> {
    return Room.find({ 
      playerIds: playerId,
      creatorId: { $ne: playerId }, // not the creator
      type: 'private',
      status: { $ne: 'closed' } 
    }).sort({ createdAt: -1 });
  }

  // Get count of active private rooms for a player
  async getPlayerActiveRoomsCount(playerId: string): Promise<number> {
    return Room.countDocuments({ 
      creatorId: playerId, 
      type: 'private',
      status: { $ne: 'closed' } 
    });
  }
}

export const roomService = new RoomService();
