import mongoose from "mongoose";

const slideSchema = new mongoose.Schema({
  heading: {
    type: String,
  },
  paragraph: {
    type: String,
  },
  image: {
    type: String,
  },
});

const webstorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  coverphoto: {
    type: String,
    max: 195,
    required: true,
  },
  date: {
    type: Date,
  },
  link:{
    type: String,
  },
  ads:{
    type: String,
  },
  lastimage:{
    type: String,
  },
  lastheading:{
    type: String,
  },
  slides: {
    type: [slideSchema],
  },
});


const WebStory = mongoose.model('WebStory', webstorySchema);

export default WebStory;