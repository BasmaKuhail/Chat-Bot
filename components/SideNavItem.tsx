import type { ReactNode } from "react";

export default function SideNavItem({
    children,
    isSelected,
    onClick,
}: {
    children: ReactNode;
    isSelected: boolean;
    onClick: () => void;
}){
    return(
        <button
            type="button"
            onClick={onClick}
            className={`text-16px flex w-full cursor-pointer flex-row items-center justify-start gap-3 rounded-[12px] p-3 px-5 text-left font-semibold transition hover:bg-gray-100 ${
                isSelected ? "bg-white-0 text-blue-10 shadow-sm" : "text-gray-500"
            }`}
        >
            {children}
        </button>
    )
}
