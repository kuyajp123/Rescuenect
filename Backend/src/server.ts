import db from '@/db/firestoreConfig';
import mainRouter from '@/routes';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
dotenv.config();
const app: Application = express();

db;
const PORT = parseInt(process.env.PORT!);

const allowedOrigins = [process.env.FRONTEND_URL, process.env.MOBILE_APP_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', mainRouter);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`server running at http://localhost:${PORT}`);
});
