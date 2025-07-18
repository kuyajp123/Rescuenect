import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
require('dotenv').config();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT;
app.use(cookieParser());
import cors from 'cors';
import userRoutes from '@/routes/users';


app.use(cors({
  origin: process.env.FRONTEND_URL!,
  // origin: "*",
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/', userRoutes);
app.get('/', (req: any, res: any) => res.send("hello world"));

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})