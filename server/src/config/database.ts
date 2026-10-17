import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const connectDB = async (): Promise<void> => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      const memoryServer = await MongoMemoryServer.create();
      mongoURI = memoryServer.getUri();
      console.info(
        "⚠️ MONGODB_URI not set, using an in-memory database (data resets on restart)",
      );
    }

    const conn = await mongoose.connect(mongoURI);
    console.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {});

mongoose.connection.on("reconnected", () => {});

export default connectDB;
