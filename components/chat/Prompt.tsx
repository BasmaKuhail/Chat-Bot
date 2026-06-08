import { useState } from "react";
import HighlightedText from "./HighlightedText";
import type { ChatAttachment } from "@/types/messages";
import { formatFileSize } from "@/lib/attachments";

type PromptProps = {
    text: string;
    attachments?: ChatAttachment[];
    highlightQuery?: string;
    disabled?: boolean;
    onEdit?: (text: string) => void;
};

export default function Prompt({
    text,
    attachments = [],
    highlightQuery = "",
    disabled = false,
    onEdit,
}: PromptProps){
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(text);

    const handleSave = () => {
        const nextText = draft.trim();

        if (!nextText || nextText === text) {
            setDraft(text);
            setIsEditing(false);
            return;
        }

        setIsEditing(false);
        onEdit?.(nextText);
    };

    if (isEditing) {
        return (
            <div className="flex w-full flex-col gap-2 rounded-b-[13px] rounded-l-[13px] bg-blue-100 p-3 shadow-md">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-h-24 w-full resize-y rounded-[8px] bg-white-0 p-3 text-sm text-gray-900 outline-none ring-1 ring-blue-200 focus:ring-blue-10"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setDraft(text);
                            setIsEditing(false);
                        }}
                        className="cursor-pointer rounded-[7px] px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-white/60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="cursor-pointer rounded-[7px] bg-blue-10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-20"
                    >
                        Save and regenerate
                    </button>
                </div>
            </div>
        );
    }

    return(
        <div className="group flex w-fit max-w-full flex-col items-end gap-2">
            <div className="whitespace-pre-wrap break-words rounded-b-[13px] rounded-l-[13px] bg-blue-100 p-4 px-6 text-gray-900 shadow-md">
                {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                            <span
                                key={attachment.id}
                                className="max-w-full truncate rounded-[7px] bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-blue-20"
                                title={`${attachment.name} (${formatFileSize(attachment.size)})`}
                            >
                                {attachment.name}
                            </span>
                        ))}
                    </div>
                )}
                <HighlightedText query={highlightQuery}>{text}</HighlightedText>
            </div>
            {onEdit && (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={disabled}
                    className="cursor-pointer px-1 text-xs font-semibold text-gray-400 opacity-0 transition hover:text-blue-10 disabled:cursor-not-allowed disabled:opacity-30 group-hover:opacity-100 focus:opacity-100"
                >
                    Edit
                </button>
            )}
        </div>
    )
}
