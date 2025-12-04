import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { gameService, roomService } from '../services';
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

    // Resize and convert avatar to base64 if provided
    let avatarBase64: string | undefined;
    if (avatarFile) {
      const resizedBuffer = await resizeAvatar(avatarFile.buffer);
      avatarBase64 = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    }

    // Check if player already exists in database
    const existingPlayer = await gameService.getPlayerByUsername(trimmedNickname);
    
    if (existingPlayer) {
      // Update avatar if provided
      if (avatarBase64) {
        await gameService.updatePlayerAvatar(trimmedNickname, avatarBase64);
      }

      return res.json({
        success: true,
        token: existingPlayer.token,
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

    // Create new player with token (single DB operation)
    await gameService.createPlayer(trimmedNickname, avatarBase64, token);

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

// ==================== Room Endpoints ====================

// Get list of public rooms
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const rooms = await roomService.getPublicRooms();
    res.json({
      success: true,
      data: rooms.map(r => roomService.formatRoom(r)),
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get specific room info
router.get('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const currentRound = roomService.getCurrentRound(room.id);
    
    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create a new private room (players can only create private rooms)
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { name, maxPlayers, minBet, maxBet, creatorId } = req.body;

    if (!name || !maxPlayers || !minBet || !maxBet || !creatorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, maxPlayers, minBet, maxBet, creatorId' 
      });
    }

    if (maxPlayers < 2 || maxPlayers > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'maxPlayers must be between 2 and 100' 
      });
    }

    if (minBet < 1 || minBet > maxBet) {
      return res.status(400).json({ 
        success: false, 
        message: 'minBet must be at least 1 and less than or equal to maxBet' 
      });
    }

    // Players can only create private rooms
    const room = await roomService.createRoom({
      name,
      maxPlayers,
      minBet,
      maxBet,
      type: 'private',
      creatorId,
    });

    res.status(201).json({
      success: true,
      data: roomService.formatRoom(room),
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Join a room by ID
router.post('/rooms/:roomId/join', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, message: 'playerId is required' });
    }

    const result = await roomService.joinRoom(roomId, playerId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const currentRound = roomService.getCurrentRound(roomId);

    res.json({
      success: true,
      data: {
        room: roomService.formatRoom(result.room!),
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          bets: currentRound.bets,
          totalPool: currentRound.totalPool,
          status: currentRound.status,
        } : null,
        config: roomService.getRoomConfig(result.room!),
      },
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Join a room by invite code
router.post('/rooms/join-by-code', async (req: Request, res: Response) => {
  try {
    const { inviteCode, playerId } = req.body;

    if (!inviteCode || !playerId) {
      return res.status(400).json({ success: false, message: 'inviteCode and playerId are required' });
    }

    const result = await roomService.joinRoomByInviteCode(inviteCode, playerId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const currentRound = roomService.getCurrentRound(result.room!.id);

    res.json({
      success: true,
      data: {
        room: roomService.formatRoom(result.room!),
        currentRound: currentRound ? {
          id: currentRound.id,
          startTime: currentRound.startTime,
          endTime: currentRound.endTime,
          bets: currentRound.bets,
          totalPool: currentRound.totalPool,
          status: currentRound.status,
        } : null,
        config: roomService.getRoomConfig(result.room!),
      },
    });
  } catch (error) {
    console.error('Join room by code error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Leave a room
router.post('/rooms/:roomId/leave', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, message: 'playerId is required' });
    }

    const result = await roomService.leaveRoom(roomId, playerId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Close a room (creator only)
router.post('/rooms/:roomId/close', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ success: false, message: 'requesterId is required' });
    }

    const result = await roomService.closeRoom(roomId, requesterId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Close room error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== Existing Endpoints ====================

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

// Get global game config
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: gameService.getConfig(),
  });
});

export default router;
