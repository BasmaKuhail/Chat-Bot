import type { Message } from "@/types/messages";

function getExportMessages(chat: Message[]) {
  const firstPromptIndex = chat.findIndex((message) => message.type === "prompt");

  return firstPromptIndex === -1 ? [] : chat.slice(firstPromptIndex);
}

function getFileName(chat: Message[], extension: string) {
  const firstPrompt = getExportMessages(chat).find(
    (message) => message.type === "prompt"
  );
  const baseName = firstPrompt?.text
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50)
    .replace(/-+$/g, "");

  return `${baseName || "brainbot-chat"}.${extension}`;
}

function downloadFile(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .trim();
}

export function exportChatAsMarkdown(chat: Message[]) {
  const content = getExportMessages(chat)
    .map((message) =>
      message.type === "prompt"
        ? `## You\n\n${message.text}`
        : `## BrainBot\n\n${message.text}`
    )
    .join("\n\n---\n\n");

  downloadFile(
    `# BrainBot Conversation\n\n${content}\n`,
    getFileName(chat, "md"),
    "text/markdown;charset=utf-8"
  );
}

export function exportChatAsText(chat: Message[]) {
  const content = getExportMessages(chat)
    .map((message) => {
      const author = message.type === "prompt" ? "You" : "BrainBot";
      return `${author}:\n${stripMarkdown(message.text)}`;
    })
    .join("\n\n----------------------------------------\n\n");

  downloadFile(
    `BrainBot Conversation\n\n${content}\n`,
    getFileName(chat, "txt"),
    "text/plain;charset=utf-8"
  );
}

export async function exportChatAsPdf(chat: Message[]) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({
    unit: "pt",
    format: "a4",
  });
  const messages = getExportMessages(chat);
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      document.addPage();
      y = margin;
    }
  };

  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.text("BrainBot Conversation", margin, y);
  y += 32;

  for (const message of messages) {
    const author = message.type === "prompt" ? "You" : "BrainBot";
    const lines = document.splitTextToSize(
      stripMarkdown(message.text),
      contentWidth
    ) as string[];

    ensureSpace(32);
    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.setTextColor(message.type === "prompt" ? 0 : 65, 80, 120);
    document.text(author, margin, y);
    y += 18;

    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(45, 45, 45);

    for (const line of lines) {
      ensureSpace(15);
      document.text(line, margin, y);
      y += 15;
    }

    y += 16;
  }

  document.save(getFileName(chat, "pdf"));
}
