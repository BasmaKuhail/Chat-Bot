import type { AttachmentKind, ChatAttachment } from "@/types/messages";

export const MAX_ATTACHMENT_COUNT = 1;
export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_SIZE = 12 * 1024 * 1024;
export const MAX_DOCUMENT_CHARACTERS = 80_000;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "html",
  "htm",
  "xml",
  "yaml",
  "yml",
]);

export const ATTACHMENT_ACCEPT =
  ".docx,.txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.yaml,.yml,image/jpeg,image/png,image/webp,image/gif";

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getAttachmentKind(file: File): AttachmentKind | null {
  const extension = getExtension(file.name);

  if (IMAGE_MIME_TYPES.has(file.type)) {
    return "image";
  }

  if (
    extension === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return "document";
  }

  return null;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("The file could not be encoded."));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File) {
  if (file.type === "image/gif" || file.size <= 1_200_000) {
    return fileToDataUrl(file);
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 1_800;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    bitmap.close();
    return fileToDataUrl(file);
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const optimizedBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? 0.84 : undefined)
  );

  return fileToDataUrl(optimizedBlob ?? file);
}

async function extractDocumentText(file: File) {
  const extension = getExtension(file.name);

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }

  return file.text();
}

export async function prepareAttachment(file: File): Promise<ChatAttachment> {
  const kind = getAttachmentKind(file);

  if (!kind) {
    throw new Error(`${file.name} is not a supported file type.`);
  }

  if (file.size === 0) {
    throw new Error(`${file.name} is empty.`);
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error(`${file.name} is larger than 8 MB.`);
  }

  const base = {
    id: crypto.randomUUID(),
    name: file.name.slice(0, 160),
    kind,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };

  if (kind === "document") {
    const text = (await extractDocumentText(file))
      .replace(/\u0000/g, "")
      .trim();

    if (!text) {
      throw new Error(`No readable text was found in ${file.name}.`);
    }

    return {
      ...base,
      text: text.slice(0, MAX_DOCUMENT_CHARACTERS),
    };
  }

  return {
    ...base,
    dataUrl: await optimizeImage(file),
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
