import PlusIcon from "@/public/icons/Plus";
import ChatIcon from "@/public/icons/Chat";
import HistoryIcon from "@/public/icons/History";
import Profile from "@/public/icons/profile";
import LogoutIcon from "@/public/icons/Logout";

import Btn from "./Btn";
import SideNavItem from "./SideNavItem";
import Image from "next/image";
import logo from "@/public/images/logo.png"
import { useChat } from "@/context/chatContext";
import { useToast } from "@/context/toastContext";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type NavItem = {
    title: string;
    image: ReactNode;
    path?: string;
    isSelected: boolean;
    onClick: () => void;
};

export default function SideNav(){
    const {resetChat} = useChat();
    const { showToast } = useToast();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const route = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function checkAuth() {
            try {
                const response = await fetch("/api/auth/me");
                const result = await response.json();

                if (isMounted) {
                    setIsLoggedIn(Boolean(result.isLoggedIn));
                }
            } catch {
                if (isMounted) {
                    setIsLoggedIn(false);
                }
            } finally {
                if (isMounted) {
                    setIsCheckingAuth(false);
                }
            }
        }

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const isSelected = (path: string) => route.pathname === path;

    const closeMobileNav = () => {
        setIsMobileNavOpen(false);
    };

    const handleNewChat = () => {
        resetChat();
        closeMobileNav();
        route.push("/");
    };

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/logout", { method: "POST" });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            setIsLoggedIn(false);
            resetChat();
            closeMobileNav();
            showToast({ type: "success", message: "Logged out successfully." });
            route.push("/auth/login");
        } catch {
            showToast({ type: "error", message: "Logout failed. Please try again." });
        }
    };

    const handleNavigate = (path: string) => {
        closeMobileNav();
        route.push(path);
    };

    const sideNavBtns: NavItem[] = [
        {
            title: "Current Chat",
            image: <ChatIcon className="text-current"/>,
            path: "/",
            isSelected: isSelected("/"),
            onClick: () => handleNavigate("/"),
        },
        {
            title: "History",
            image: <HistoryIcon className="text-current"/>,
            path: "/chat/history",
            isSelected: isSelected("/chat/history"),
            onClick: () => handleNavigate("/chat/history"),
        },
        // {
        //     title: "Archive",
        //     image: <ArchiveIcon className="text-current"/>,
        //     path: "/chat/archive",
        //     isSelected: isSelected("/chat/archive"),
        //     onClick: () => handleNavigate("/chat/archive"),
        // },
    ];

    if (!isCheckingAuth) {
        if (isLoggedIn) {
            sideNavBtns.splice(
                1,
                0,
                {
                    title: "Profile",
                    image: <Profile className="text-current"/>,
                    path: "/profile",
                    isSelected: isSelected("/profile"),
                    onClick: () => handleNavigate("/profile"),
                },
                {
                    title: "Logout",
                    image: <LogoutIcon className="text-current"/>,
                    isSelected: false,
                    onClick: handleLogout,
                }
            );
        } else {
            sideNavBtns.splice(1, 0, {
                title: "Create Account",
                image: <LogoutIcon className="text-current"/>,
                path: "/auth",
                isSelected: isSelected("/auth") || isSelected("/auth/login"),
                onClick: () => handleNavigate("/auth"),
            });
        }
    }
    
    return(
        <>
            <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="fixed left-4 top-4 z-40 flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[8px] bg-white-0 text-gray-500 shadow-md md:hidden"
                aria-label="Open navigation"
            >
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
            </button>

            {isMobileNavOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={closeMobileNav}
                    aria-label="Close navigation"
                />
            )}

            <div
                className={`fixed left-0 top-0 z-50 flex min-h-screen w-72 flex-col gap-8 bg-white-5 p-4 pt-8 shadow-lg transition-transform duration-200 md:w-80 md:translate-x-0 md:gap-10 md:pl-20 md:pr-6 md:pt-10 ${
                    isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="relative flex items-center justify-center">
                    <Image src={logo} alt="logo" width={200}/>
                    <button
                        type="button"
                        onClick={closeMobileNav}
                        className="absolute -right-3 -top-8 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] text-xl font-semibold text-gray-500 hover:bg-gray-100 md:hidden"
                        aria-label="Close navigation"
                    >
                        x
                    </button>
                </div>
                <Btn 
                    onClick={handleNewChat}
                >
                    <div className="flex w-full flex-row items-center justify-start gap-3 whitespace-nowrap">
                        <PlusIcon className="shrink-0 text-white-0"/>
                        <span>New Chat</span>
                    </div>
                </Btn>
                <div className="flex flex-col gap-2">
                    {sideNavBtns.map((btn)=> 
                        <SideNavItem key={btn.title} isSelected={btn.isSelected} onClick={btn.onClick}>
                            {btn.image}
                            {btn.title}
                        </SideNavItem>
                    )}
                </div>
            </div>
        </>
    )
}
