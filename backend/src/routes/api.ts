import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { gameService } from '../services';
import { config } from '../config';

const router = Router();

// Map to store nickname -> token (persists in memory, resets on server restart)
const nicknameTokens = new Map<string, string>();

// Login endpoint - creates JWT token for a nickname (returns existing token if nickname exists)
router.get('/login/:nickname', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.params;

    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nickname is required' });
    }

    const trimmedNickname = nickname.trim();
    const nicknameLower = trimmedNickname.toLowerCase();

    // Check if nickname already has a token
    const existingToken = nicknameTokens.get(nicknameLower);
    if (existingToken) {
      return res.json({
        success: true,
        token: existingToken,
        nickname: trimmedNickname,
      });
    }

    // Check if player with this username already exists in database - generate new token for them
    const existingPlayer = await gameService.getPlayerByUsername(trimmedNickname);
    if (existingPlayer) {
      const token = jwt.sign(
        { nickname: existingPlayer.username },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      nicknameTokens.set(nicknameLower, token);
      
      return res.json({
        success: true,
        token,
        nickname: existingPlayer.username,
      });
    }

    // Create new JWT token for new nickname
    const token = jwt.sign(
      { nickname: trimmedNickname },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Store token for this nickname
    nicknameTokens.set(nicknameLower, token);

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
