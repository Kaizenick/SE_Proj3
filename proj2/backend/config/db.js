import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27018/food-del";

export const connectDB = async () => {
  await mongoose.connect(MONGO_URI).then(() => console.log("DB Connected"));
};
