import { Message } from "@/types/messages";
import { ReactNode, useContext, useState, createContext } from "react";

type ChatContextValue = {
    chat: Message[];
    setChat: React.Dispatch<React.SetStateAction<Message[]>>;
    currentChatId: string | null;
    setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
    loadChat: (chatId: string, messages: Message[]) => void;
    resetChat: () => void;
};

const initialChat: Message[] = [
    {
        type:"response", 
        text:"Welcome to BrainRot, I'm your AI agient, feel free to share your thoughts with me, I'm here to assist you :)"
    }
]
const ChatContext = createContext<ChatContextValue | null>(null);

export default function ChatProvider({children}:{children:ReactNode}){
    const [chat, setChat] = useState<Message[]>(initialChat);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    
    const resetChat = () => {
        setChat(initialChat)
        setCurrentChatId(null)
    }

    const loadChat = (chatId: string, messages: Message[]) => {
        setCurrentChatId(chatId)
        setChat(messages.length ? messages : initialChat)
    }

    return(
        <ChatContext.Provider value={{chat, setChat, currentChatId, setCurrentChatId, loadChat, resetChat}}>
            {children}  
        </ChatContext.Provider>

    )
}

export function useChat(){
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used inside ChatProvider");
    }
    return context;
}
