export type PromptMessage = {
  type: "prompt";
  text: string;
};

export type ResponseMessage = {
  type: "response";
  text: string;
  versions?: string[];
  activeVersion?: number;
};

export type Message = PromptMessage | ResponseMessage;
