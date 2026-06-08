import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

const HIGHLIGHT_CLASS_NAME =
  "rounded-sm bg-yellow-200 px-0.5 text-inherit ring-1 ring-yellow-300";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(node: ReactNode, query: string): ReactNode {
  const searchQuery = query.trim();

  if (!searchQuery) {
    return node;
  }

  if (typeof node === "string" || typeof node === "number") {
    const text = String(node);
    const pattern = new RegExp(`(${escapeRegExp(searchQuery)})`, "gi");
    const parts = text.split(pattern);

    if (parts.length === 1) {
      return node;
    }

    return parts.map((part, index) =>
      part.toLocaleLowerCase() === searchQuery.toLocaleLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          data-chat-search-match
          className={HIGHLIGHT_CLASS_NAME}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  if (Array.isArray(node)) {
    return node.map((child) => highlightText(child, searchQuery));
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === "mark") {
      return node;
    }

    return cloneElement(
      node as ReactElement<{ children?: ReactNode }>,
      undefined,
      highlightText(node.props.children, searchQuery)
    );
  }

  return node;
}

export default function HighlightedText({
  children,
  query,
}: {
  children: ReactNode;
  query: string;
}) {
  return <>{highlightText(children, query)}</>;
}
