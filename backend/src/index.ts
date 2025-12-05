import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { config } from './config';
import { apiRoutes } from './routes';
import { WebSocketService, gameService, roomService } from './services';

const app = express();
const server = createServer(app);

const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

// Default public rooms configuration
const DEFAULT_ROOMS = [
  {
    name: 'Low Stake',
    minBet: 1,
    maxBet: 100,
    maxPlayers: 20,
    roundDurationMs: 10 * 1000, // 1 minute
  },
  {
    name: 'High Stake',
    minBet: 100,
    maxBet: 1000,
    maxPlayers: 20,
    roundDurationMs: 10 * 1000, // 2 minutes
  },
];

// SPA fallback - serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Connect to MongoDB and start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    server.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
      
      // Initialize WebSocket after server is listening
      const wsService = new WebSocketService(server);
      gameService.setWebSocketService(wsService);
      roomService.setWebSocketService(wsService);
      
      // Create default public rooms if they don't exist
      await roomService.ensureDefaultRooms(DEFAULT_ROOMS);
      
      console.log('Room-based game system initialized');
      console.log('Default public rooms created');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

start();
