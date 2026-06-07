import type { ReactNode } from "react";
import TypingIndicator from "./TypingIndicator";
import NextIcon from "@/public/icons/Next";
import RegenerateIcon from "@/public/icons/Regenerate";

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-gray-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function renderLine(line: string, index: number): ReactNode {
  const trimmedLine = line.trim();
  const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
  const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);

  if (bulletMatch) {
    return (
      <li key={index} className="ml-5 list-disc pl-1">
        {renderBoldText(bulletMatch[1])}
      </li>
    );
  }

  if (numberedMatch) {
    return (
      <li key={index} className="ml-5 list-decimal pl-1">
        {renderBoldText(numberedMatch[2])}
      </li>
    );
  }

  return (
    <p key={index} className="leading-7">
      {renderBoldText(line)}
    </p>
  );
}

function renderMessage(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(renderLine);
}

type ResponseProps = {
  text: string;
  isStreaming?: boolean;
  versionIndex?: number;
  versionCount?: number;
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;
  onRegenerate?: () => void;
};

export default function Response({
  text,
  isStreaming = false,
  versionIndex = 0,
  versionCount = 1,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
}: ResponseProps) {
  const isError = text.startsWith("Error:");

  return (
    <div
      className={`w-fit max-w-full rounded-b-[13px] rounded-r-[13px] border p-5 px-6 shadow-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-gray-100 bg-white-0 text-gray-800"
      }`}
    >
      <div className="flex flex-col gap-3 text-[15px]">{renderMessage(text)}</div>
      {isStreaming && <TypingIndicator compact />}
      {!isError && !isStreaming && onRegenerate && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="group relative cursor-pointer rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Regenerate response"
          >
            <RegenerateIcon />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Regenerate response
            </span>
          </button>
          {versionCount > 1 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <button
                type="button"
                onClick={onPreviousVersion}
                disabled={versionIndex === 0}
                className="group relative cursor-pointer rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous response"
              >
                <NextIcon className="rotate-180" />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  View previous response
                </span>
              </button>
              <span>{versionIndex + 1} / {versionCount}</span>
              <button
                type="button"
                onClick={onNextVersion}
                disabled={versionIndex === versionCount - 1}
                className="group relative cursor-pointer rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next response"
              >
                <NextIcon />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  View next response
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
