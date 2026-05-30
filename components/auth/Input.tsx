import Image from "next/image";
import { useState } from "react";
import showPassIcon from "@/public/icons/showPass.svg";
import unshowPassIcon from "@/public/icons/unshowPass.svg";

type InputProps = {
    label: string;
    type: "text" | "password";
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    minLength?: number;
};

export default function Input({ label, type, value, placeholder, onChange, minLength }: InputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPasswordField = type === "password";
    const inputType = isPasswordField && isPasswordVisible ? "text" : type;

    return (
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
            {label}
            <div className="relative">
                <input
                    type={inputType}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required
                    minLength={minLength}
                    className={`w-full rounded-[12px] border border-gray-200 bg-white-0 px-4 py-3 text-gray-800 outline-none focus:border-blue-10 ${isPasswordField ? "pr-12" : ""}`}
                    placeholder={placeholder}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center cursor-pointer"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        <Image
                            src={isPasswordVisible ? unshowPassIcon : showPassIcon}
                            alt=""
                            width={20}
                            height={20}
                        />
                    </button>
                )}
            </div>
        </label>
    );
}
