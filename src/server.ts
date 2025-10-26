import mongoose from 'mongoose';
import app from './app';

import { createServer } from 'http';
import config from './app/config';
import { initSocketServer } from './app/socket';

async function main() {
  try {
    // MongoDB connection with better error handling
    if (!config.database_url) {
      throw new Error('Database URL is not defined in environment variables');
    }

    await mongoose.connect(config.database_url, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log('✅ Database connected successfully');

    const server = createServer(app);
    initSocketServer(server);

    const PORT = config.port || 5000;
    server.listen(PORT, () => {
      console.log(`✅ App is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
