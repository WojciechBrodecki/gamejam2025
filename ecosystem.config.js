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
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/casino',
        ROUND_DURATION_MS: 60000,
        CASINO_COMMISSION_PERCENT: 5,
        MIN_BET: 1,
        MAX_BET: 10000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/casino_dev',
        ROUND_DURATION_MS: 30000,
        CASINO_COMMISSION_PERCENT: 5,
      },
    },
    {
      name: 'casino-frontend',
      script: 'serve',
      args: '-s ./frontend/dist -l 3000',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
