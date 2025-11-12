import express from "express";
const router = express.Router();
import { create, list, list2, listAllBlogsCategoriesTags, read, remove, update, relatedposts, listSearch, listByUser, allblogs, feeds, allblogslugs } from "../controllers/blog.js"
import { requireSignin, adminMiddleware, authMiddleware, canUpdateDeleteBlog } from "../controllers/auth.js"

router.post('/blog', requireSignin, adminMiddleware, create);
router.get('/blogs', list);
router.get('/allblogs', allblogs);
router.get('/rss', feeds);
router.get('/blogs/search', listSearch);
router.get('/blogs-categories-tags', listAllBlogsCategoriesTags);
router.get('/blog/:slug', read);
router.delete('/blog/:slug', requireSignin, adminMiddleware, remove);
router.patch('/blog/:slug', requireSignin, adminMiddleware, update);
router.get('/blog/related/:slug', relatedposts);
// routes/blog.js
router.get('/allblogslugs', async (req, res) => {
  try {
    const blogs = await blogs.find().select('slug');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:username/userblogs', list2);
router.post('/user/blog', requireSignin, authMiddleware, create);
router.get('/:username/blogs', listByUser);
router.delete('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, remove);
router.patch('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, update);

export default router

