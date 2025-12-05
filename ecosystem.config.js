module.exports = {
  apps: [
    {
      name: 'casino-backend',
      script: './backend/dist/bundle.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 11115,
        MONGODB_URI: 'mongodb://localhost:27017/casino',
        ROUND_DURATION_MS: 60000,
        ROUND_DELAY_MS: 5000,
        CASINO_COMMISSION_PERCENT: 5,
        MIN_BET: 1,
        MAX_BET: 10000,
        JWT_SECRET: 'change-this-secret-in-production',
        MAX_PRIVATE_ROOMS_PER_PLAYER: 2,
      },
    },
  ],
};
