import Card from "./CardContainer";
import Input from "./Input";
import {
    validateRegisterUser,
    type RegisterFieldErrors,
    type RegisterUser,
} from "@/lib/validations/register";
import Link from "next/link";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useState } from "react";

type RegisterProps = {
    isLogin?: boolean;
};

export default function Register({ isLogin = false }: RegisterProps){
    const router = useRouter();
    const [username, setUsername] = useState("@");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<RegisterFieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const title = isLogin ? "Welcome back" : "Join BrainBot";
    const subtitle = isLogin ? "Sign in to continue your conversations." : "Experience the future of intelligent collaboration.";
    const submitText = isLogin ? "Login" : "Submit";

    const handleUsernameChange = (value: string) => {
        const withoutExtraAtSigns = value.replace(/@/g, "");
        setUsername(`@${withoutExtraAtSigns}`);
        setErrors((current) => ({ ...current, username: undefined }));
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined }));
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        setErrors((current) => ({ ...current, confirmPassword: undefined }));
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setErrors((current) => ({ ...current, email: undefined }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log({ username, password, email, confirmPassword });
        if (isLogin) {
            return;
        }

        const user: RegisterUser = {
            username,
            password,
            email,
            confirmPassword,
        };
        const validationErrors = validateRegisterUser(user);

        if (Object.values(validationErrors).some(Boolean)) {
            setErrors(validationErrors);
            return;
        }

        setMessage("");
        setErrors({});
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Register failed:", result.message);
                alert("Register failed: " + result.message);
                throw new Error(result.message || "Registration failed");
            }
        
        router.push("/");
        console.log("Register success:", result);

        } catch {
            console.error("Error during API call.");
            setMessage("Unable to reach the auth API.");
        } finally {
            console.log("Finished API call.");
            setIsSubmitting(false);
        }
    };

    return(
        <div className="flex w-full bg-white-10 h-screen items-center justify-center">
            <Card>
                <div className="flex flex-col w-full items-center gap-2">
                    <p className="text-36px font-bold text-blue-20">{title}</p>
                    <p className="text-m">{subtitle}</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mt-6">
                    <Input
                        label="Username"
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        minLength={2}
                        placeholder="@username"
                        error={errors.username}
                    />                    
                    {!isLogin && (
                        <Input
                            label="email"
                            type="text"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="example@gmail.com"
                            error={errors.email}
                        />
                    )}
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your password"
                        error={errors.password}
                    />

                    {!isLogin && (
                        <Input
                            label="Confirm password"
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword}
                        />
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cursor-pointer bg-gradient-to-r from-[#0050D5] to-[#7B9CFF] text-white font-semibold py-3 px-15 rounded-[12px] hover:opacity-90 transition shadow-lg mt-2"
                    >
                        {isSubmitting ? "Submitting..." : submitText}
                    </button>
                    {message && (
                        <p className="text-center text-sm text-gray-500">{message}</p>
                    )}
                    <p className="text-center text-sm text-gray-500">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <Link
                            href={isLogin ? "/auth" : "/auth/login"}
                            className="ml-1 cursor-pointer font-semibold text-blue-20 hover:underline"
                        >
                            {isLogin ? "Create one" : "Login"}
                        </Link>
                    </p>
                </form>
            </Card> 
        </div>

    )
}
