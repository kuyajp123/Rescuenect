import db from '@/db/firestoreConfig';
import mainRouter from '@/routes';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
dotenv.config();
const app: Application = express();

db;
const PORT = parseInt(process.env.PORT!);

const allowedOrigins = [process.env.FRONTEND_URL, process.env.MOBILE_APP_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path.startsWith('/health'), // Skip rate limiting for health checks
});

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(limiter);
app.use('/', mainRouter);

// ... (keep existing code)

app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'File too large',
        message: 'The uploaded image exceeds the 50MB size limit. Please choose a smaller file.',
      });
      return;
    }
    res.status(400).json({ error: 'Upload Error', message: err.message });
    return;
  }

  if (err instanceof Error) {
    if (err.message === 'Only image files are allowed!') {
      res.status(400).json({
        error: 'Invalid File Type',
        message: 'Only image files (JPEG, PNG, WEBP) are allowed.',
      });
      return;
    }

    console.error('Error occurred:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`server running at http://localhost:${PORT}`);
});
