import express from "express";
const router = express.Router();
import{ create, list, read, remove } from "../controllers/category.js"

// validators
import { runvalidation } from "../validators/index.js"
import { requireSignin, adminMiddleware } from "../controllers/auth.js"
import { check } from "express-validator";



const categoryCreateValidator = [
    check('name').not().isEmpty().withMessage('Name is required')
];


router.post('/category', categoryCreateValidator, runvalidation, requireSignin, adminMiddleware, create);
router.get('/categories', list);
router.get('/category/:slug', read);
router.delete('/category/:slug', requireSignin, adminMiddleware, remove);

export default router