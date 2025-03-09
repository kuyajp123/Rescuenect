import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
require('dotenv').config()
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT;
app.use(cookieParser());

import './services/passport';
import router from './routes/auth';
import { verifyToken } from './middleware/verifyToken';
import errorHandler from './middleware/errorHandler';

app.use(express.json());
app.use('/', router);

interface CustomRequest extends Request {
  userid: string,
  email: string,
  name: string
}

app.get('/', (req, res, next) => {
  verifyToken(req as CustomRequest, res, next).catch(next);
})

// Protected Route Example
app.get('/dashboard', (req: any, res, next) => {
  verifyToken(req as CustomRequest, req, next)
  res.send(`Welcome ${req.user.name}`);
  console.log(req.user);
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})