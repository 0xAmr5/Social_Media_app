import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service";

const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI!);
    console.log(`DB connected successfully ✅`);
  } catch (err) {
    console.log(`Fail to connect DB ❌`, err);
    process.exit(1); 
  }
};
export default connectDb;