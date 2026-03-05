import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
  } catch (error) {
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {});

mongoose.connection.on("reconnected", () => {});

export default connectDB;
