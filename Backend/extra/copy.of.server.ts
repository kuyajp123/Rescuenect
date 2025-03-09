import express, { Application, Request, Response } from 'express'
const app: Application = express();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';

require('dotenv').config()

const PORT = process.env.PORT;

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Generate JWT token
  const token = jwt.sign(
    { id: profile.id, name: profile.displayName, email: profile.emails?.[0].value },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );

  // Attach the token to `req.authInfo`
  done(null, profile, { token });
}));
  
  // Google Login Route
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  // Google OAuth Callback
  app.get('/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req: any, res) => {
      const token = req.authInfo;  // <-- This is where the token exists now
  
      // Send the token as JSON response
      res.json({ token });
    }
  );
  
  // Middleware to Protect Routes
  function verifyToken(req: any, res: any, next: any) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
  
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) return res.status(403).send('Forbidden');
      req.user = { 
        id: decoded.id, 
        name: decoded.name, 
        email: decoded.email 
      };
      next();
    });
  }
  
  // Protected Route Example
  app.get('/dashboard', verifyToken, (req: any, res) => {
    res.send(`Welcome ${req.user.name}`);
    console.log(req.user);
  });

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})