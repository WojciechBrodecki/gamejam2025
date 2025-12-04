import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { gameService } from '../services';
import { config } from '../config';

const router = Router();

// Configure multer for memory storage (max 5MB, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Map to store nickname -> token (persists in memory, resets on server restart)
const nicknameTokens = new Map<string, string>();

// Resize image so the longer side is 320px, maintaining aspect ratio
async function resizeAvatar(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  const width = metadata.width || 320;
  const height = metadata.height || 320;
  const maxSize = 320;

  // Determine which dimension to constrain
  if (width >= height) {
    // Width is longer, resize by width
    return image.resize(maxSize, null, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
  } else {
    // Height is longer, resize by height
    return image.resize(null, maxSize, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
  }
}

// Login endpoint - creates JWT token for a nickname (returns existing token if nickname exists)
// POST with optional avatar image (form-data: nickname, avatar)
router.post('/login/:nickname', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { nickname } = req.params;
    const avatarFile = req.file;

    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nickname is required' });
    }

    const trimmedNickname = nickname.trim();
    const nicknameLower = trimmedNickname.toLowerCase();

    // Resize and convert avatar to base64 if provided
    let avatarBase64: string | undefined;
    if (avatarFile) {
      const resizedBuffer = await resizeAvatar(avatarFile.buffer);
      avatarBase64 = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    }

    // Check if nickname already has a token
    const existingToken = nicknameTokens.get(nicknameLower);
    if (existingToken) {
      // Update avatar if provided
      if (avatarBase64) {
        await gameService.updatePlayerAvatar(trimmedNickname, avatarBase64);
      }
      
      const player = await gameService.getPlayerByUsername(trimmedNickname);
      return res.json({
        success: true,
        token: existingToken,
        nickname: trimmedNickname,
        avatar: player?.avatar || null,
      });
    }

    // Check if player with this username already exists in database - generate new token for them
    const existingPlayer = await gameService.getPlayerByUsername(trimmedNickname);
    if (existingPlayer) {
      // Update avatar if provided
      if (avatarBase64) {
        await gameService.updatePlayerAvatar(trimmedNickname, avatarBase64);
      }
      
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
        avatar: avatarBase64 || existingPlayer.avatar || null,
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
      avatar: avatarBase64 || null,
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

// Get player avatar as image
router.get('/players/:id/avatar', async (req: Request, res: Response) => {
  try {
    const player = await gameService.getPlayer(req.params.id);
    
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    
    if (!player.avatar) {
      return res.status(404).json({ success: false, message: 'Avatar not found' });
    }

    // Parse base64 data URL: data:image/jpeg;base64,/9j/4AAQ...
    const matches = player.avatar.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(500).json({ success: false, message: 'Invalid avatar format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(imageBuffer);
  } catch (error) {
    console.error('Avatar fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
