import Card from "./CardContainer";
import Input from "./Input";
import Link from "next/link";
import { useState } from "react";

type RegisterProps = {
    isLogin?: boolean;
};

export default function Register({ isLogin = false }: RegisterProps){
    const [username, setUsername] = useState("@");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const title = isLogin ? "Welcome back" : "Join BrainBot";
    const subtitle = isLogin ? "Sign in to continue your conversations." : "Experience the future of intelligent collaboration.";
    const submitText = isLogin ? "Login" : "Submit";

    const handleUsernameChange = (value: string) => {
        const withoutExtraAtSigns = value.replace(/@/g, "");
        setUsername(`@${withoutExtraAtSigns}`);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
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
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Enter your password"
                    />
                    {!isLogin && (
                        <Input
                            label="Confirm password"
                            type="password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm your password"
                        />
                    )}
                    <button
                        type="submit"
                        className="cursor-pointer bg-gradient-to-r from-[#0050D5] to-[#7B9CFF] text-white font-semibold py-3 px-15 rounded-[12px] hover:opacity-90 transition shadow-lg mt-2"
                    >
                        {submitText}
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
