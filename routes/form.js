const router = express.Router();
import { contactForm, contactBlogAuthorForm } from "../controllers/form.js"
import express from "express"
import { check } from "express-validator";
import { runvalidation } from "../validators/index.js";


const contactFormValidator = [
    check('name')
        .not()
        .isEmpty()
        .withMessage('Name is required'),
    check('email')
        .isEmail()
        .withMessage('Must be valid email address'),
    check('message')
        .not()
        .isEmpty()
        .isLength({ min: 20 })
        .withMessage('Message must be at least 20 characters long')
];



router.post('/contact', contactFormValidator, runvalidation, contactForm);
router.post('/contacting-blog-author', contactFormValidator, runvalidation, contactBlogAuthorForm);

export default router