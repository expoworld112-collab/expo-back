import express from "express";
import { check } from "express-validator";
import {
  signup,
  signin,
  signout,
  requireSignin,
  forgotPassword,
  resetPassword,
  preSignup
} from "../controllers/auth.js";
import { runvalidation } from "../validators/index.js";
import api from './api'; // depending on folder structure

const router = express.Router();

// ======================= Validators =======================

// Signup validator
const usersignupvalidator = [
  check('name')
    .isLength({ min: 5 })
    .withMessage('Name must be at least 5 characters long'),
  check('username')
    .isLength({ min: 3, max: 10 })
    .withMessage('Username must be between 3 and 10 characters'),
  check('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  check('password')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
    .withMessage(
      'Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long'
    )
];

// Signin validator
const usersigninvalidator = [
  check('email')
    .isEmail()
    .withMessage('Must be a valid email address')
];

// Forgot password validator
const forgotPasswordValidator = [
  check('email')
    .notEmpty()
    .isEmail()
    .withMessage('Must be a valid email address')
];

// Reset password validator
const resetPasswordValidator = [
  check('newPassword')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
    .withMessage(
      'Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long'
    )
];

// ======================= Routes =======================

// Pre-signup: validate and send activation email
router.post('/pre-signup', usersignupvalidator, runvalidation, preSignup);

// Signup: finalize account creation with token
router.post('/signup', signup);

// Signin: login user
router.post('/signin', usersigninvalidator, runvalidation, signin);

// Signout: logout user
router.get('/signout', signout);

// Forgot password: send reset link
router.put('/forgot-password', forgotPasswordValidator, runvalidation, forgotPassword);

// Reset password: update password
router.put('/reset-password', resetPasswordValidator, runvalidation, resetPassword);

export default router;
