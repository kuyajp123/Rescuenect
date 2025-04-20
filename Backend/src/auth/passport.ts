import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET){
    throw new Error('google strategy options not provided!');
}

if ( !JWT_SECRET || !JWT_REFRESH_TOKEN_SECRET ){
    throw new Error('UNAUTHORIZED access');
}

interface GoogleStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
}

interface VerifyCallback {
    (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void): void;
}

const googleStrategyOptions: GoogleStrategyOptions = {
    clientID: GOOGLE_CLIENT_ID as string,
    clientSecret: GOOGLE_CLIENT_SECRET as string,
    callbackURL: "/auth/google/callback"
};

const verifyCallback: VerifyCallback = (accessToken, refreshToken, profile: any, done) => {
    // Implementation here
    const firstName = profile._json.given_name;
    const lastName = profile._json.family_name ? profile._json.family_name : null;
    const birthDate = profile._json.birthdays ? profile._json[0].date : null;

    const user = {
        googleID: profile.id,
        email: profile.emails[0].value,
        firstName: firstName,
        lastName: lastName,
        name: profile.displayName ? profile.displayName : null,
        birthDate: birthDate,
        picture: profile.photos[0].value
    }

    // console.log({ user })

    done(null, { user });
};

passport.use(new GoogleStrategy(googleStrategyOptions, verifyCallback));
