import type { ReactNode } from "react";
import TypingIndicator from "./TypingIndicator";

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
};

export default function Response({
  text,
  isStreaming = false,
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
    </div>
  );
}
