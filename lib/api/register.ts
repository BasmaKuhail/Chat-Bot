import { supabaseServer } from "@/lib/supabaseServer";

type SignUpUserParams = {
  username: string;
  email: string;
  password: string;
};

export function signUpUser({ username, email, password }: SignUpUserParams) {
  return supabaseServer.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        name: username,
        display_name: username,
      },
    },
  });
}
