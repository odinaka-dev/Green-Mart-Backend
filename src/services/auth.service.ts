import bcrypt from "bcryptjs";
import User from "../model/user.model";
import generateToken from "../utils/generateToken";

export const registerUserService = async (payloads: any) => {
  // check if email exist across user database
  const existingUser = await User.findOne({
    email: payloads.email,
  });

  // if user already exists with this email fire this.
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payloads.password, 12);

  // create user - destructure payload and save hashhed password in the database
  const user = await User.create({
    ...payloads,
    password: hashedPassword,
  });

  const token = generateToken(user._id.toString());

  return {
    user,
    token,
  };
};

// LOGIN USERS
export const LoginUserService = async (payloads: any) => {
  const user = await User.findOne({
    email: payloads.email,
  }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    payloads.password,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user._id.toString());

  return {
    // user,
    token,
  };
};
