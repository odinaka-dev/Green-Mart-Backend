import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/user.model";

const run = async () => {
  const [fullName, email, phoneNumber, password] = process.argv.slice(2);

  if (!fullName || !email || !phoneNumber || !password) {
    console.error(
      "Usage: npx ts-node src/scripts/seedAdmin.ts <fullName> <email> <phoneNumber> <password>",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set in the environment.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const normalisedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalisedEmail });

    if (existing) {
      if (existing.role === "ADMIN") {
        console.log(`"${normalisedEmail}" is already an ADMIN. Nothing to do.`);
      } else {
        existing.set("role", "ADMIN");
        await existing.save();
        console.log(`Promoted existing user "${normalisedEmail}" to ADMIN.`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      fullName,
      email: normalisedEmail,
      phoneNumber,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin created successfully:");
    console.log(`  id:    ${admin._id}`);
    console.log(`  name:  ${admin.fullName}`);
    console.log(`  email: ${admin.email}`);
    console.log("\nLog in at POST /api/admin/login to get a token.");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("Failed to seed admin:", err.message);
  process.exit(1);
});
