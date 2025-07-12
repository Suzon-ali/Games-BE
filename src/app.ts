import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import os from 'os';
import router from './app/routes';
import globalErrorHandler from './app/miiddlewares/globalErrorHandler';
import notFoundHandler from './app/miiddlewares/notFoundHandler';
import { StatusCodes } from 'http-status-codes';

const app: Application = express();

//parser
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3000','http://192.168.0.183:3000', 'https://games-client-jp6a.vercel.app'],
    credentials: true,
  }),
);

app.set("trust proxy", 1);

//router
app.use('/api/v1/', router);

app.get('/', (req: Request, res: Response) => {
  const currentDateTime = new Date().toISOString();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const serverHostname = os.hostname();
  const serverPlatform = os.platform();
  const serverUptime = os.uptime();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Welcome to the Game world',
    version: '1.0.0',
    clientDetails: {
      ipAddress: clientIp,
      accessedAt: currentDateTime,
    },
    serverDetails: {
      hostname: serverHostname,
      platform: serverPlatform,
      uptime: `${Math.floor(serverUptime / 60 / 60)} hours ${Math.floor(
        (serverUptime / 60) % 60,
      )} minutes`,
    },
  });
});

app.use(globalErrorHandler);
app.use(notFoundHandler);



export default app;
