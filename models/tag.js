import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            maxlength: 32
        },
        description: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true
        }
    },
    // { timestamps: true }
);

export default mongoose.model('Tag', tagSchema);