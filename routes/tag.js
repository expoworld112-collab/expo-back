import express from "express";
const router = express.Router();
import { requireSignin, adminMiddleware } from "../controllers/auth.js"
import { create, list, read, remove } from "../controllers/tag.js"
import { runvalidation } from "../validators/index.js"
import { check } from "express-validator";

const createTagValidator = [
    check('name').not().isEmpty().withMessage('Name is required')
];



// only difference is methods not name 'get' | 'post' | 'delete'
router.post('/tag', createTagValidator, runvalidation, requireSignin, adminMiddleware, create);
router.get('/tags', list);
router.get('/tag/:slug', read);
router.delete('/tag/:slug', requireSignin, adminMiddleware, remove);

export default router