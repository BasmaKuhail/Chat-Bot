import Attach from "@/public/icons/Attach"
import SendBtn from "./SendBtn"
import { useRef, useState } from "react";
import {
    ATTACHMENT_ACCEPT,
    formatFileSize,
    MAX_ATTACHMENT_COUNT,
    MAX_TOTAL_ATTACHMENT_SIZE,
    prepareAttachment,
} from "@/lib/attachments";
import type { ChatAttachment } from "@/types/messages";
import { useRouter } from "next/router";

type InputProps = {
    onSend: (userText: string, attachments: ChatAttachment[]) => void;
    isGenerating?: boolean;
    onCancel?: () => void;
};

export default function Input ({
    onSend,
    isGenerating = false,
    onCancel,
}: InputProps){
    const [userInput, setUserInput] = useState("");
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [attachmentError, setAttachmentError] = useState("");
    const [isPreparingFiles, setIsPreparingFiles] = useState(false);
    const [isCheckingCredit, setIsCheckingCredit] = useState(false);
    const router = useRouter();
    
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleAttachClick = async () => {
        if (attachments.length >= MAX_ATTACHMENT_COUNT) {
            setAttachmentError("Only one file can be attached per message.");
            return;
        }

        setIsCheckingCredit(true);
        setAttachmentError("");

        try {
            const response = await fetch("/api/attachments/quota");
            const result = await response.json();

            if (response.status === 401) {
                setAttachmentError("Log in to attach one file per day.");
                await router.push("/auth/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "Attachment credit could not be checked."
                );
            }

            if (!result.canUpload) {
                const availableAt =
                    typeof result.nextAvailableAt === "string"
                        ? new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                        }).format(new Date(result.nextAvailableAt))
                        : "later";

                setAttachmentError(
                    `Your daily file credit is used. Try again after ${availableAt}.`
                );
                return;
            }

            fileInputRef.current?.click();
        } catch (error) {
            setAttachmentError(
                error instanceof Error
                    ? error.message
                    : "Attachment credit could not be checked."
            );
        } finally {
            setIsCheckingCredit(false);
        }
    };

    const sendMessage = () => {
        if (
            (!userInput.trim() && attachments.length === 0) ||
            isGenerating ||
            isPreparingFiles
        ) {
            return;
        }

        onSend(userInput.trim() || "Please analyze the attached file.", attachments);
        setUserInput("");
        setAttachments([]);
        setAttachmentError("");

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleFiles = async (files: FileList | null) => {
        const selectedFiles = Array.from(files ?? []);

        if (!selectedFiles.length) {
            return;
        }

        if (attachments.length + selectedFiles.length > MAX_ATTACHMENT_COUNT) {
            setAttachmentError(`You can attach up to ${MAX_ATTACHMENT_COUNT} files.`);
            return;
        }

        const totalSize =
            attachments.reduce((sum, attachment) => sum + attachment.size, 0) +
            selectedFiles.reduce((sum, file) => sum + file.size, 0);

        if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
            setAttachmentError("Attachments must be 12 MB or less in total.");
            return;
        }

        setIsPreparingFiles(true);
        setAttachmentError("");

        try {
            const prepared = await Promise.all(selectedFiles.map(prepareAttachment));
            setAttachments((current) => [...current, ...prepared]);
        } catch (error) {
            setAttachmentError(
                error instanceof Error ? error.message : "A file could not be attached."
            );
        } finally {
            setIsPreparingFiles(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return(
        <div className="fixed bottom-0 left-0 z-30 flex w-full flex-col items-center justify-end gap-2 rounded-t-[12px] bg-white-10/95 px-3 pb-4 pt-2 backdrop-blur-sm md:left-80 md:w-[calc(100%-20rem)] md:px-10 md:pr-19">
            {isGenerating && onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-full border border-gray-200 bg-white-0 px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                >
                    Cancel response
                </button>
            )}
            <div className="flex w-full flex-col gap-3 rounded-[12px] border border-gray-100 bg-white-5 p-3 text-gray-500 shadow-sm md:p-4">
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2" aria-label="Attached files">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex max-w-full items-center gap-2 rounded-[8px] border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-20"
                            >
                                <span className="truncate font-semibold">
                                    {attachment.name}
                                </span>
                                <span className="shrink-0 text-gray-400">
                                    {formatFileSize(attachment.size)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAttachments((current) =>
                                            current.filter((item) => item.id !== attachment.id)
                                        )
                                    }
                                    disabled={isGenerating}
                                    className="cursor-pointer text-base leading-none text-gray-400 hover:text-red-600 disabled:cursor-not-allowed"
                                    aria-label={`Remove ${attachment.name}`}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex w-full flex-row items-end justify-between gap-3 md:gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ATTACHMENT_ACCEPT}
                        className="sr-only"
                        onChange={(event) => void handleFiles(event.target.files)}
                    />
                    <button
                        type="button"
                        onClick={() => void handleAttachClick()}
                        disabled={isGenerating || isPreparingFiles || isCheckingCredit}
                        className="flex shrink-0 cursor-pointer rounded-full bg-gray-100 p-3 transition hover:bg-gray-200 disabled:cursor-wait disabled:opacity-50"
                        aria-label="Attach files"
                        title="Attach one image, DOCX, or text file per day"
                    >
                        <Attach/>
                    </button>
                
                <textarea  
                    className="max-h-[180px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words overflow-y-auto text-sm focus:outline-none md:max-h-[200px] md:text-base" 
                    placeholder="Ask a question or provide research notes..." 
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setUserInput(e.target.value);

                        const target = e.target;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}>
                    
                </textarea>
                <SendBtn 
                    onClick={sendMessage}
                />
                </div>
                {(isPreparingFiles || isCheckingCredit || attachmentError) && (
                    <p
                        className={`text-xs ${attachmentError ? "text-red-600" : "text-gray-400"}`}
                        role={attachmentError ? "alert" : "status"}
                    >
                        {attachmentError ||
                            (isCheckingCredit
                                ? "Checking file credit..."
                                : "Preparing attachment...")}
                    </p>
                )}
            </div>
            <p className="text-center text-xs text-gray-400 md:text-14px">AI models can occasionally hallucinate. Please verify critical information.</p>
        </div>
    )
}
