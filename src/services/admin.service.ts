import bcrypt from "bcryptjs";
import User from "../model/user.model";
import generateToken from "../utils/generateToken";

export const createAdminService = async (payload: any) => {
  const { adminSecret, ...data } = payload;

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    const err: any = new Error("Invalid admin secret");
    err.statusCode = 403;
    throw err;
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    const err: any = new Error("User already exists with this email");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const admin = await User.create({
    ...data,
    role: "ADMIN",
    password: hashedPassword,
  });

  const token = generateToken(admin._id.toString());

  return {
    admin: {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    },
    token,
  };
};

export const adminLoginService = async (payload: any) => {
  const { email, password } = payload;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const err: any = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (user.role !== "ADMIN") {
    const err: any = new Error("Access denied. Admin accounts only.");
    err.statusCode = 403;
    throw err;
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    const err: any = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id.toString());

  return {
    token,
    admin: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};
