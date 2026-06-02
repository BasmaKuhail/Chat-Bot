import type { NextApiRequest, NextApiResponse } from "next";
import { signUpUser } from "@/lib/api/register";
import { isRegisterUser, isValidEmail } from "@/lib/validations/register";

type RegisterResponse = {
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  console.log("Register request body:", req.body);
  if (!isRegisterUser(req.body)) {
    return res.status(400).json({ message: "Invalid user data." });
  }

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (!username || username === "@") {
    return res.status(400).json({ message: "Username is required." });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const { data, error } = await signUpUser({
    email,
    password,
    username,
  });

if (error) {
  console.error("Supabase signup error:", error);

  const message =
    error.message === "email rate limit exceeded"
      ? "Too many signup emails were sent. Please try again later."
      : error.message;

  return res.status(400).json({ message });
}

  if (!data.user) {
    return res.status(500).json({
      message: "User could not be created.",
    });
  }

  return res.status(201).json({
    message: "Account created successfully.",
    user: {
      id: data.user.id,
      username,
      email: data.user.email ?? email,
    },
  });
}
