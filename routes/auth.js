import express from "express";
import { check } from "express-validator";
import {
  signup,
  signin,
  signout,
  requireSignin,
  forgotPassword,
  resetPassword,
  // preSignup
} from "../controllers/auth.js";
import { runvalidation } from "../validators/index.js";

const router = express.Router();

// ======================= Validators =======================
const usersignupvalidator = [
  check('name').isLength({ min: 5 }).withMessage('Name must be at least 5 characters long'),
  check('username').isLength({ min: 3, max: 10 }).withMessage('Username must be between 3 and 10 characters'),
  check('email').isEmail().withMessage('Must be a valid email address'),
  check('password')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
    .withMessage('Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long')
];

const usersigninvalidator = [
  check('email').isEmail().withMessage('Must be a valid email address')
];

const forgotPasswordValidator = [
  check('email').notEmpty().isEmail().withMessage('Must be a valid email address')
];

const resetPasswordValidator = [
  check('newPassword')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
    .withMessage('Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long')
];

// ======================= Routes =======================
router.post('/pre-signup', usersignupvalidator, runvalidation, preSignup);
router.post('/signup', signup);
router.post('/signin', usersigninvalidator, runvalidation, signin);
router.get('/signout', signout);
router.put('/forgot-password', forgotPasswordValidator, runvalidation, forgotPassword);
router.put('/reset-password', resetPasswordValidator, runvalidation, resetPassword);

export default router;
