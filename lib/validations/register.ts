export type RegisterUser = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginUser = {
  email: string;
  password: string;
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

export function isLoginUser(value: unknown): value is LoginUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return typeof user.email === "string" && typeof user.password === "string";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeUsername(username: string) {
  return username.trim().replace(/^@+/, "");
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterUser, string>>;
export type LoginFieldErrors = Partial<Record<keyof LoginUser, string>>;

export function validateRegisterUser(user: RegisterUser) {
  const errors: RegisterFieldErrors = {};
  const username = normalizeUsername(user.username);
  const email = user.email.trim().toLowerCase();

  if (!username) {
    errors.username = "Username is required.";
  } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    errors.username = "Use 3-30 letters, numbers, or underscores.";
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

export function validateLoginUser(user: LoginUser) {
  const errors: LoginFieldErrors = {};
  const email = user.email.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    errors.email = "Valid email is required.";
  }

  if (!user.password) {
    errors.password = "Password is required.";
  }

  return errors;
}
