import PlusIcon from "@/public/icons/Plus";
import ChatIcon from "@/public/icons/Chat";
import HistoryIcon from "@/public/icons/History";
import ArchiveIcon from "@/public/icons/Archived";
import Profile from "@/public/icons/profile";

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

    const handleNewChat = () => {
        resetChat();
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
            showToast({ type: "success", message: "Logged out successfully." });
            route.push("/auth/login");
        } catch {
            showToast({ type: "error", message: "Logout failed. Please try again." });
        }
    };

    const sideNavBtns: NavItem[] = [
        {
            title: "Current Chat",
            image: <ChatIcon className="text-current"/>,
            path: "/",
            isSelected: isSelected("/"),
            onClick: () => route.push("/"),
        },
        {
            title: "History",
            image: <HistoryIcon className="text-current"/>,
            path: "/chat/history",
            isSelected: isSelected("/chat/history"),
            onClick: () => route.push("/chat/history"),
        },
        {
            title: "Archive",
            image: <ArchiveIcon className="text-current"/>,
            path: "/chat/archive",
            isSelected: isSelected("/chat/archive"),
            onClick: () => route.push("/chat/archive"),
        },
    ];

    if (!isCheckingAuth) {
        sideNavBtns.splice(1, 0, isLoggedIn
            ? {
                title: "Logout",
                image: <Profile className="text-current"/>,
                isSelected: false,
                onClick: handleLogout,
            }
            : {
                title: "Create Account",
                image: <Profile className="text-current"/>,
                path: "/auth",
                isSelected: isSelected("/auth") || isSelected("/auth/login"),
                onClick: () => route.push("/auth"),
            }
        );
    }
    
    return(
        <div className="bg-white-5 flex flex-col p-2 pl-20 shadow-sm p-4 pr-6 min-h-screen pt-10 opacity:50 gap-10 fixed left-0">
            <Image src={logo} alt="logo" width={150}/> 
            <Btn 
                onClick={handleNewChat}
            >
                <div className="flex flex-row gap-3 items-center justify-start w-full">
                    <PlusIcon className="text-white-0"/>
                    New Chat
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
    )
}
