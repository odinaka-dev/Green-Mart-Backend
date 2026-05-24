import jwt from "jsonwebtoken";

const generateToken = (userId: string) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    },
  );
};

export default generateToken;
