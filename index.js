// index.js
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load env
dotenv.config({ path: "./.env" });

// Import routes
import blogRoutes from "./routes/blog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import tagRoutes from "./routes/tag.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";

// Import models
import User from "./models/user.js";

const { MONGO_URI, PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND, JWT_SECRET } = process.env;
const port = PORT || 8000;

// -----------------
// App & CORS
// -----------------
const app = express();
const allowedOrigins = [FRONTEND];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS not allowed"), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
}));

// Handle preflight requests
app.options("*", cors());

// -----------------
// Middleware
// -----------------
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

// -----------------
// MongoDB
// -----------------
mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch(err => console.log("DB Error =>", err));

// -----------------
// Passport Google OAuth
// -----------------
app.use(passport.initialize());

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        email: profile.emails[0].value,
        username: profile.displayName,
        name: profile.displayName,
        profile: profile.photos[0]?.value || "",
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// -----------------
// Routes
// -----------------
app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", formRoutes);
app.use("/api", ImageRoutes);
app.use("/api", storyRoutes);

app.get("/", (req, res) => res.json("Backend index"));

// -----------------
// Google OAuth Routes
// -----------------
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ _id: req.user._id, email: req.user.email }, JWT_SECRET, { expiresIn: "10d" });

    // Redirect frontend with token
    res.redirect(`${FRONTEND}/auth/success?token=${token}`);
  }
);

// Logout route
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect(FRONTEND);
});

// -----------------
// Start Server
// -----------------
app.listen(port, () => console.log(`Server running on port ${port}`));
