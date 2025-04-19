import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
require('dotenv').config()
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT;
app.use(cookieParser());
import cors from 'cors';

import './auth/passport';
import authRouter from './routes/authRouter';
import router from './routes/router';
import errorHandler from './middleware/errorHandler';

app.use(cors({
  origin: process.env.FRONTEND_URL!,
  // origin: "*",
  credentials: true,
}));

app.use(express.json());
app.use('/', authRouter);
app.use('/', router);

app.get('/', (req: any, res: any) => res.send("hello world"));

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})