export type RegisterUser = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function isRegisterUser(value: unknown): value is RegisterUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    typeof user.password === "string" &&
    typeof user.confirmPassword === "string"
  );
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterUser, string>>;

export function validateRegisterUser(user: RegisterUser) {
  const errors: RegisterFieldErrors = {};
  const username = user.username.trim();
  const email = user.email.trim().toLowerCase();

  if (!username || username === "@") {
    errors.username = "Username is required.";
  }

  if (!email || !isValidEmail(email)) {
    errors.email = "Valid email is required.";
  }

  if (!user.password) {
    errors.password = "Password is required.";
  } else if (user.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (user.password !== user.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
