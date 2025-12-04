import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { config } from './config';
import { apiRoutes } from './routes';
import { WebSocketService, gameService } from './services';

const app = express();
const server = createServer(app);

const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('hello world from BE');
});

app.use('/api', apiRoutes);

// Connect to MongoDB and start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
      
      // Initialize WebSocket after server is listening
      const wsService = new WebSocketService(server);
      gameService.setWebSocketService(wsService);
      
      // Start the first round
      gameService.startNewRound();
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
