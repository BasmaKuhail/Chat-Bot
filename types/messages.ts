export type AttachmentKind = "image" | "document";

export type ChatAttachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  dataUrl?: string;
  text?: string;
};

export type PromptMessage = {
  type: "prompt";
  text: string;
  attachments?: ChatAttachment[];
  attachmentContextToken?: string;
};

export type ResponseMessage = {
  type: "response";
  text: string;
  versions?: string[];
  activeVersion?: number;
};

export type Message = PromptMessage | ResponseMessage;
