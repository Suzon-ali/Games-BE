import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import router from './app/routes'
import globalErrorHandler from './app/miiddlewares/globalErrorHandler';
import notFoundHandler from './app/miiddlewares/notFoundHandler';

const app: Application = express();

//parser
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
);
app.use(cookieParser());

//router
app.use('/api/v1/', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;