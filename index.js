import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

import authRoutes from "./routes/auth.js";

const { MONGO_URI, PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND } = process.env;
const port = PORT || 8000;

const app = express();

// ---------------------------
// CORS Setup (robust for frontend + credentials)
// ---------------------------
const allowedOrigins = [FRONTEND, "https://expo-front-eight.vercel.app"];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman or curl
    if (allowedOrigins.indexOf(origin) === -1) return callback(new Error("CORS not allowed"));
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true, // must enable for cookies
}));

// Enable preflight requests for all routes
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ---------------------------
// Middleware
// ---------------------------
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

// ---------------------------
// Session setup
// ---------------------------
app.use(session({
  secret: GOOGLE_CLIENT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // only true on HTTPS
    sameSite: 'None',
    httpOnly: true
  }
}));

// ---------------------------
// Passport Google OAuth
// ---------------------------
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  scope: ["profile", "email"]
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value }, "email username name profile role");
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ---------------------------
// Routes
// ---------------------------
app.use("/api", authRoutes);

// ---------------------------
// MongoDB Connection
// ---------------------------
mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch(err => console.log("DB Error =>", err));

// ---------------------------
// Start server
// ---------------------------
app.listen(port, () => console.log(`Server running on port ${port}`));
