import Input from "@/components/auth/Input";
import SideNav from "@/components/SideNav";
import { useToast } from "@/context/toastContext";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();

        if (response.status === 401) {
          await router.replace("/auth/login");
          return;
        }

        if (!response.ok || !result.profile) {
          throw new Error(result.message || "Profile could not be loaded.");
        }

        if (isMounted) {
          setProfile(result.profile);
          setName(result.profile.name);
        }
      } catch (error) {
        if (isMounted) {
          showToast({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Profile could not be loaded.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router, showToast]);

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setNameError("Name must be between 2 and 50 characters.");
      return;
    }

    setNameError("");
    setIsSavingName(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Profile could not be updated.");
      }

      setProfile(result.profile);
      setName(result.profile.name);
      showToast({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      showToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Profile could not be updated.",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasError) {
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Password could not be updated.");
      }

      setPassword("");
      setConfirmPassword("");
      showToast({ type: "success", message: "Password updated successfully." });
    } catch (error) {
      showToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Password could not be updated.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white-10">
      <SideNav />
      <main className="flex w-full flex-col gap-8 px-4 py-20 md:ml-80 md:w-[calc(100%-20rem)] md:px-10 md:py-12">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-blue-20 md:text-36px">
            Your Profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Manage your account details and password.
          </p>
        </div>

        {isLoading ? (
          <div className="grid max-w-3xl gap-6">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[12px] border border-gray-200 bg-white-0"
              />
            ))}
          </div>
        ) : profile ? (
          <div className="grid max-w-3xl gap-6">
            <section className="rounded-[12px] border border-gray-200 bg-white-0 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">Profile details</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the name shown on your account.
              </p>
              <form onSubmit={handleNameSubmit} className="mt-6 flex flex-col gap-4">
                <Input
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(value) => {
                    setName(value);
                    setNameError("");
                  }}
                  placeholder="Enter your name"
                  error={nameError}
                />
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Email
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSavingName || name.trim() === profile.name}
                  className="mt-2 w-fit cursor-pointer rounded-[12px] bg-blue-10 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingName ? "Saving..." : "Save changes"}
                </button>
              </form>
            </section>

            <section className="rounded-[12px] border border-gray-200 bg-white-0 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">Change password</h2>
              <p className="mt-1 text-sm text-gray-500">
                Use at least 8 characters for your new password.
              </p>
              <form
                onSubmit={handlePasswordSubmit}
                className="mt-6 flex flex-col gap-4"
              >
                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    setPasswordError("");
                  }}
                  minLength={8}
                  placeholder="Enter a new password"
                  error={passwordError}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setConfirmPasswordError("");
                  }}
                  minLength={8}
                  placeholder="Confirm your new password"
                  error={confirmPasswordError}
                />
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="mt-2 w-fit cursor-pointer rounded-[12px] bg-blue-10 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
                >
                  {isSavingPassword ? "Updating..." : "Update password"}
                </button>
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
