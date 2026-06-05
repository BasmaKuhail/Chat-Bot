import Card from "./CardContainer";
import Input from "./Input";
import {
    validateLoginUser,
    validateRegisterUser,
    type LoginFieldErrors,
    type LoginUser,
    type RegisterFieldErrors,
    type RegisterUser,
} from "@/lib/validations/register";
import { useToast } from "@/context/toastContext";
import Link from "next/link";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useState } from "react";

type RegisterProps = {
    isLogin?: boolean;
};

export default function Register({ isLogin = false }: RegisterProps){
    const router = useRouter();
    const { showToast } = useToast();
    const [username, setUsername] = useState("@");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<RegisterFieldErrors & LoginFieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const title = isLogin ? "Welcome back" : "Join BrainBot";
    const subtitle = isLogin ? "Sign in to continue your conversations." : "Experience the future of intelligent collaboration.";
    const submitText = isLogin ? "Login" : "Submit";
    const loadingText = isLogin ? "Logging in..." : "Submitting...";

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

        const validationErrors = isLogin
            ? validateLoginUser({
                email,
                password,
            } satisfies LoginUser)
            : validateRegisterUser({
                username,
                password,
                email,
                confirmPassword,
            } satisfies RegisterUser);

        if (Object.values(validationErrors).some(Boolean)) {
            setErrors(validationErrors);
            showToast({
                type: "error",
                message: "Please fix the highlighted fields.",
            });
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const response = await fetch(isLogin ? "/api/login" : "/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    isLogin
                        ? {
                            email,
                            password,
                        }
                        : {
                            username,
                            email,
                            password,
                            confirmPassword,
                        }
                ),
            });

            const result = await response.json();

            if (!response.ok) {
                showToast({
                    type: "error",
                    message: result.message || "Auth request failed.",
                });
                return;
            }

            if (!isLogin && result.requiresEmailConfirmation) {
                showToast({
                    type: "success",
                    message: result.message || "Account created. Please confirm your email before logging in.",
                });
                setPassword("");
                setConfirmPassword("");
                return;
            }
        
            router.push("/");
            console.log(isLogin ? "Login success:" : "Register success:", result);

        } catch (error) {
            console.error("Error during API call.", error);
            showToast({
                type: "error",
                message: "Unable to reach the auth API.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return(
        <div className="flex w-full bg-white-10 h-screen items-center justify-center pt-15 md:pt-0">
            <Card>
                <div className="flex flex-col w-full items-center gap-2">
                    <p className="text-36px font-bold text-blue-20">{title}</p>
                    <p className="text-m">{subtitle}</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mt-6">
                    {isLogin ? (
                        <Input
                            label="Email"
                            type="text"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="example@gmail.com"
                            error={errors.email}
                        />
                    ) : (
                        <>
                            <Input
                                label="Username"
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                minLength={2}
                                placeholder="@username"
                                error={errors.username}
                            />
                            <Input
                                label="Email"
                                type="text"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="example@gmail.com"
                                error={errors.email}
                            />
                        </>
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
                        {isSubmitting ? loadingText : submitText}
                    </button>
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
