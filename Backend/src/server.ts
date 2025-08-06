import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import db from '@/db/firestoreConfig';
import cors from 'cors';
import routes from '@/router/routes';

db;
const PORT = process.env.PORT;

// weather data service
import './jobs/weatherSched';


app.use(cors({
  origin: process.env.FRONTEND_URL!,
  // origin: "*",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})