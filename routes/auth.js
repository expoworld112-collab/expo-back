import express from "express";
const router = express.Router();
import { signup, signin, signout, requireSignin , forgotPassword,resetPassword, preSignup } from "../controllers/auth.js"
import { runvalidation } from "../validators/index.js"
import { check } from "express-validator";


const usersignupvalidator = [
    check('name').isLength({ min: 5 }).withMessage('Name of more than 5 characters is required '),
    check('username').isLength({ min: 3, max: 10 }).withMessage('Username of more than 3 and less than 11 characters is required '),
    check('email').isEmail().withMessage('Must be a valid email address'),
    check("password", "The password must contain at least 1 lowercase, 1 uppercase, 1 numeric,1 special character (!@#$%^&*]) and must be 8 characters or longer.").matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
]

const resetPasswordValidator = [
    check("newPassword", "The password must contain at least 1 lowercase, 1 uppercase, 1 numeric,1 special character (!@#$%^&*]) and must be 8 characters or longer.").matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
]


const usersigninvalidator = [ check('email').isEmail().withMessage('Must be a valid email address') ]
const forgotPasswordValidator = [ check('email').not().isEmpty().isEmail().withMessage('Must be a valid email address')  ];




router.post('/pre-signup', usersignupvalidator, runvalidation, preSignup);
router.post('/signup', signup)
router.post('/signin', usersigninvalidator, runvalidation, signin)
router.get('/signout', signout);


router.put('/forgot-password', forgotPasswordValidator, runvalidation, forgotPassword);
router.put('/reset-password', resetPasswordValidator, runvalidation, resetPassword);



export default router;