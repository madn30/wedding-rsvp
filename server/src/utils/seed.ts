import dotenv from "dotenv";
import mongoose from "mongoose";
import { Admin } from "../models/Admin";

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const email = process.env.ADMIN_EMAIL || "admin@wedding.com";
  const password = process.env.ADMIN_PASSWORD || "AdminPass123!";

  const existing = await Admin.findOne({ email });
  if (existing) {
    process.exit(0);
  }

  await Admin.create({ email, password });

  process.exit(0);
};

seed().catch((err) => {
  process.exit(1);
});
