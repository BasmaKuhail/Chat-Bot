import {
  Children,
  isValidElement,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import TypingIndicator from "./TypingIndicator";
import NextIcon from "@/public/icons/Next";
import RegenerateIcon from "@/public/icons/Regenerate";
import { highlightText } from "./HighlightedText";

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = getTextContent(children).replace(/\n$/, "");
  const codeElement = Children.toArray(children).find(isValidElement);
  const className =
    isValidElement<{ className?: string }>(codeElement)
      ? codeElement.props.className
      : undefined;
  const language =
    className?.match(/(?:language-|lang-)([\w-]+)/)?.[1] ?? "code";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-4 overflow-hidden rounded-[10px] border border-gray-700 bg-[#111827] text-gray-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#1f2937] px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="cursor-pointer rounded px-2 py-1 text-xs font-semibold text-gray-300 transition hover:bg-gray-700 hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        {children}
      </pre>
    </div>
  );
}

type ResponseProps = {
  text: string;
  highlightQuery?: string;
  isStreaming?: boolean;
  versionIndex?: number;
  versionCount?: number;
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;
  onRegenerate?: () => void;
};

export default function Response({
  text,
  highlightQuery = "",
  isStreaming = false,
  versionIndex = 0,
  versionCount = 1,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
}: ResponseProps) {
  const isError = text.startsWith("Error:");

  return (
    <div className="group/response flex w-fit max-w-full flex-col items-start">
      <div
        className={`w-fit max-w-full rounded-b-[13px] rounded-r-[13px] border p-5 px-6 shadow-sm ${
          isError
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-gray-100 bg-white-0 text-gray-800"
        }`}
      >
        <div className="markdown-response max-w-none text-[15px] leading-7">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, { detect: true }]]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-5 text-2xl font-bold text-gray-950 first:mt-0">
                  {highlightText(children, highlightQuery)}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-5 text-xl font-bold text-gray-950 first:mt-0">
                  {highlightText(children, highlightQuery)}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-lg font-bold text-gray-900 first:mt-0">
                  {highlightText(children, highlightQuery)}
                </h3>
              ),
              p: ({ children }) => (
                <p className="my-2 first:mt-0 last:mb-0">
                  {highlightText(children, highlightQuery)}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="pl-1">{highlightText(children, highlightQuery)}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-gray-950">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-blue-200 bg-blue-50/60 px-4 py-2 text-gray-600">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-10 underline decoration-blue-200 underline-offset-2 hover:text-blue-20"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-4 max-w-full overflow-x-auto rounded-[10px] border border-gray-200">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-100 text-gray-700">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border-b border-gray-200 px-4 py-3 font-bold">
                  {highlightText(children, highlightQuery)}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-gray-100 px-4 py-3 align-top last:border-b-0">
                  {highlightText(children, highlightQuery)}
                </td>
              ),
              pre: ({ children }) => (
                <CodeBlock>{highlightText(children, highlightQuery)}</CodeBlock>
              ),
              code: ({ className, children, ...props }) => {
                const isCodeBlock =
                  Boolean(className?.includes("language-")) ||
                  Boolean(className?.includes("hljs"));

                return (
                  <code
                    className={
                      isCodeBlock
                        ? className
                        : "rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-gray-800"
                    }
                    {...props}
                  >
                    {highlightText(children, highlightQuery)}
                  </code>
                );
              },
              hr: () => <hr className="my-5 border-gray-200" />,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
        {isStreaming && <TypingIndicator compact />}
      </div>
      {!isError && !isStreaming && onRegenerate && (
        <div className="mt-1.5 flex h-7 items-center gap-1 text-gray-400 opacity-0 transition-opacity group-hover/response:opacity-100 group-focus-within/response:opacity-100">
          <button
            type="button"
            onClick={onRegenerate}
            className="group relative cursor-pointer rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Regenerate response"
          >
            <RegenerateIcon className="h-4 w-4" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Regenerate response
            </span>
          </button>
          {versionCount > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
              <button
                type="button"
                onClick={onPreviousVersion}
                disabled={versionIndex === 0}
                className="group relative cursor-pointer rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous response"
              >
                <NextIcon className="h-3.5 w-3.5 rotate-180" />
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
                className="group relative cursor-pointer rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next response"
              >
                <NextIcon className="h-3.5 w-3.5" />
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
