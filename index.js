// index.js
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

// Load environment variables
dotenv.config({ path: './.env' });

// Import routes
import blogRoutes from "./routes/blog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import tagRoutes from "./routes/tag.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";

// Import models and config
import User from "./models/user.js";
import { FRONTEND } from "./config.js";

// Environment variables
const { MONGO_URI, PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const port = PORT || 8000;

const app = express();

// Middleware
// app.use(cors({
//   origin: ["https://expo-back.vercel.app", FRONTEND],
//   methods: "GET,POST,PUT,DELETE,PATCH",
//   credentials: true
// }));
app.use(
  cors({
    origin: ["https://expo-front-eight.vercel.app"], // allow only your frontend
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true, // if you need cookies or auth headers
  })
);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);
app.use('/api', formRoutes);
app.use('/api', ImageRoutes);
app.use('/api', storyRoutes);

app.get('/', (req, res) => res.json("Backend index"));

// MongoDB Connection
mongoose.set("strictQuery", true);

console.log("Connecting to MongoDB:", MONGO_URI); // Debug line

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("DB connected"))
.catch(err => console.log("DB Error =>", err));

// Session
app.use(session({
  secret: GOOGLE_CLIENT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    sameSite: 'None',
    httpOnly: true
  }
}));

// Passport Google OAuth
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

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", {
  successRedirect: FRONTEND,
  failureRedirect: `${FRONTEND}/signin`
}));

// Login success route
app.get("/login/success", async (req, res) => {
  if (req.user) {
    const token = jwt.sign({ _id: req.user._id }, "Div12@", { expiresIn: '10d' });
    res.status(200).json({ user: req.user, token });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(`${FRONTEND}/signin`);
  });
});

// Start server
app.listen(port, () => console.log(`Server is running on port ${port}`));
