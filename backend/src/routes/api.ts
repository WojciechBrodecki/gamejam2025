import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { gameService } from '../services';
import { config } from '../config';

const router = Router();

// Set to track used nicknames (persists in memory, resets on server restart)
// For production, you'd want to check against the Player collection in MongoDB
const usedNicknames = new Set<string>();

// Login endpoint - creates JWT token for a unique nickname
router.get('/login/:nickname', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.params;

    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nickname is required' });
    }

    const trimmedNickname = nickname.trim();

    // Check if nickname was already used in this session
    if (usedNicknames.has(trimmedNickname.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'Nickname already taken' });
    }

    // Check if player with this username already exists in database
    const existingPlayer = await gameService.getPlayerByUsername(trimmedNickname);
    if (existingPlayer) {
      return res.status(409).json({ success: false, message: 'Nickname already taken' });
    }

    // Mark nickname as used
    usedNicknames.add(trimmedNickname.toLowerCase());

    // Create JWT token with nickname
    const token = jwt.sign(
      { nickname: trimmedNickname },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      nickname: trimmedNickname,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current game state
router.get('/game/state', async (req: Request, res: Response) => {
  try {
    const currentRound = gameService.getCurrentRound();
    const config = gameService.getConfig();
    
    res.json({
      success: true,
      data: {
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          bets: currentRound.bets,
          totalPool: currentRound.totalPool,
          status: currentRound.status,
        } : null,
        config,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get player info
router.get('/player/:id', async (req: Request, res: Response) => {
  try {
    const player = await gameService.getPlayer(req.params.id);
    
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: player.id,
        username: player.username,
        balance: player.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new player
router.post('/player', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    // Check if username already exists
    const existingPlayer = await gameService.getPlayerByUsername(username);
    if (existingPlayer) {
      return res.json({
        success: true,
        data: {
          id: existingPlayer.id,
          username: existingPlayer.username,
          balance: existingPlayer.balance,
        },
      });
    }
    
    const player = await gameService.createPlayer(username);
    
    res.status(201).json({
      success: true,
      data: {
        id: player.id,
        username: player.username,
        balance: player.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
