import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/messages";
import {
  exportChatAsMarkdown,
  exportChatAsPdf,
  exportChatAsText,
} from "@/lib/chatExport";
import { useToast } from "@/context/toastContext";

type ExportChatProps = {
  chat: Message[];
  disabled?: boolean;
  isGenerating?: boolean;
};

export default function ExportChat({
  chat,
  disabled = false,
  isGenerating = false,
}: ExportChatProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePdfExport = async () => {
    if (disabled) {
      return;
    }

    setIsExportingPdf(true);

    try {
      await exportChatAsPdf(chat);
      setIsOpen(false);
    } catch (error) {
      console.error("PDF export failed:", error);
      showToast({ type: "error", message: "PDF export failed." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed right-4 z-30 transition-[bottom] duration-200 md:right-10 ${
        isGenerating ? "bottom-52 md:bottom-48" : "bottom-36"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className="cursor-pointer rounded-full border border-gray-200 bg-white-0 px-4 py-2 text-xs font-semibold text-gray-600 shadow-lg transition hover:border-blue-10 hover:text-blue-10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-80"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={isGenerating ? "Export is unavailable while a response is generating." : undefined}
      >
        Export chat
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-20 mb-2 w-44 overflow-hidden rounded-[10px] border border-gray-200 bg-white-0 p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              if (disabled) {
                return;
              }

              exportChatAsMarkdown(chat);
              setIsOpen(false);
            }}
            className="w-full cursor-pointer rounded-[7px] px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Markdown (.md)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              if (disabled) {
                return;
              }

              exportChatAsText(chat);
              setIsOpen(false);
            }}
            className="w-full cursor-pointer rounded-[7px] px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Plain text (.txt)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handlePdfExport}
            disabled={isExportingPdf}
            className="w-full cursor-pointer rounded-[7px] px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-wait disabled:opacity-50"
          >
            {isExportingPdf ? "Creating PDF..." : "PDF (.pdf)"}
          </button>
        </div>
      )}
    </div>
  );
}
