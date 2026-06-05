import { supabaseServer } from "@/lib/supabaseServer";

type SignInUserParams = {
  email: string;
  password: string;
};

export function signInUser({ email, password }: SignInUserParams) {
  return supabaseServer.auth.signInWithPassword({
    email,
    password,
  });
}
