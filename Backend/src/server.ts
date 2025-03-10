import express, { Application, Request, Response, NextFunction } from 'express'
const app: Application = express();
require('dotenv').config()
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT;
app.use(cookieParser());

import './auth/passport';
import router from './routes/auth';
import { verifyToken } from './middleware/verifyToken';
import errorHandler from './middleware/errorHandler';

app.use(express.json());
app.use('/', router);

interface CustomRequest extends Request {
  googleID: string;
  email: string,
  firstName: string,
  lastName: string,
  name: string,
  birthDate: string,
  picture: string
}

// Protected Route Example
app.get('/dashboard', async (req: any, res, next) => {
  await verifyToken(req as CustomRequest, res, next);

  res.send(`Welcome <br>
    user ID: ${req.user.userID}
    <br>
    email: ${req.user.email}
    <br>
    first name: ${req.user.firstName}
    <br>
    last name: ${req.user.lastName}
    <br>
    whole name: ${req.user.name}
    <br>
    birth day: ${req.user.birthDate}
    <br>
    picture: ${req.user.picture}
    `);
});

app.get('/', (req: any, res: any) => res.send("hello world"));

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})