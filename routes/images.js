import express from "express";
const router = express.Router();
import { requireSignin, adminMiddleware } from "../controllers/auth.js";
import Images from "../models/images.js";

export const uploadimages = async (req, res) => {
    try {
        const { url } = req.body;
        const images = new Images({ url });
        const data = await images.save();
        res.json(data);
    } catch (err) { res.status(400).json({ error: "Something went wrong" }) }
};

export const allimages = async (req, res) => {
    try {
        const totalCount = await Images.countDocuments({}).exec();
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;
        const data = await Images.find({}).sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();
        res.json({totalImages: totalCount , data }); 
    } catch (err) { console.error('Error fetching images:', err); res.status(500).json({ error: 'Internal Server Error' }); }  
};


export const remove = async (req, res) => {
    try {
        const { url } = req.query;
        if (url) {
            const deletedImage = await Images.findOneAndDelete({ url }).exec();
            if (deletedImage) { res.json({ message: 'Image deleted successfully' });  
            } else {  res.status(404).json({ error: 'Image Cannot be found or deleted' });   }
        } 
    } catch (err) {  console.error(err);   res.status(500).json({ error: 'Cannot delete image' }); }  
};


router.post('/uploadimages', requireSignin, adminMiddleware, uploadimages);
router.get('/allimages', allimages);
router.delete('/images/:url', remove);

export default router