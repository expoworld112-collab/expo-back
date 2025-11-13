import mongoose from "mongoose";

let conn = null;

export const connectDB = async () => {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return conn;
};
