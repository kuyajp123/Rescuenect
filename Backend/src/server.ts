import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import db from '@/db/firestoreConfig';
import './jobs/weatherSched';
import cors from 'cors';
import { weatherService } from '@/jobs/weatherSched'

db;
const PORT = process.env.PORT;
weatherService.fetchWeatherIfNeeded();

app.use(cors({
  origin: process.env.FRONTEND_URL!,
  // origin: "*",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: any, res: any) => res.send("hello world"));

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})