import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = parseInt(process.env.PORT!);
import router from '@/routes';

// Middleware to parse JSON
app.use(express.json());
app.use(cors());
app.use(express.json());

app.use('/', router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running...`);
});
