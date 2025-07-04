import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import { createServer } from 'http';
import { setupWebSocket } from './app/websocket';

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    const server = createServer(app);
    setupWebSocket(server); 
    server.listen(config.port, () => {
      console.log(`App is running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
