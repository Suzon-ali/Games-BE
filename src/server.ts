import mongoose from 'mongoose';
import app from './app';

import { createServer } from 'http';
import config from './app/config';
import { initSocketServer } from './app/socket';

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    const server = createServer(app);
    initSocketServer(server);
    server.listen(config.port, () => {
      console.log(`App is running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
