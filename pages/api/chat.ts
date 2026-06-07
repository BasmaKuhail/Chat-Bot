import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { persistChatMessages } from "@/lib/api/chatPersistence";
import { getAuthedUserFromRequest } from "@/lib/api/authedSupabase";

type ChatResponse = {
  reply: string;
};

type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; chatId?: string; saveError?: string }
  | { type: "error"; message: string };

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARACTERS = 8_000;
const MAX_HISTORY_MESSAGE_CHARACTERS = 3_000;

function getConversationHistory(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validMessages = value
    .filter(
      (item): item is ConversationMessage =>
        typeof item === "object" &&
        item !== null &&
        "role" in item &&
        (item.role === "user" || item.role === "assistant") &&
        "content" in item &&
        typeof item.content === "string" &&
        Boolean(item.content.trim())
    )
    .slice(-MAX_HISTORY_MESSAGES);

  const selected: ConversationMessage[] = [];
  let remainingCharacters = MAX_HISTORY_CHARACTERS;

  for (let index = validMessages.length - 1; index >= 0; index -= 1) {
    const message = validMessages[index];
    const content = message.content
      .trim()
      .slice(0, Math.min(MAX_HISTORY_MESSAGE_CHARACTERS, remainingCharacters));

    if (!content) {
      continue;
    }

    selected.unshift({ role: message.role, content });
    remainingCharacters -= content.length;

    if (remainingCharacters === 0) {
      break;
    }
  }

  return selected;
}

function writeStreamEvent(
  res: NextApiResponse,
  event: ChatStreamEvent
) {
  res.write(`${JSON.stringify(event)}\n`);
}

// Some API errors include an HTTP status code, like 401, 402, 404, or 429.
// Because caught errors are typed as "unknown", this helper safely checks for it.
function getErrorStatus(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

// Gets a readable error message without assuming the error is always an Error object.
function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown OpenRouter API error";
}

// Converts OpenRouter failures into messages that are safe to show in the chat UI.
// The detailed provider error stays in the server logs, not in the browser.
function getUserFacingError(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  if (status === 429 || message.includes("Too Many Requests") || message.includes("rate limit")) {
    return {
      status: 429,
      reply: "OpenRouter rate limit or quota was reached. Check your OpenRouter credits, key limit, or selected model.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      status,
      reply: "OpenRouter authentication failed. Check that the key is valid and has access to the selected model.",
    };
  }

  if (status === 402) {
    return {
      status,
      reply: "OpenRouter rejected the request because the account has insufficient credits for the selected model.",
    };
  }

  if (status === 404) {
    return {
      status,
      reply: "The selected OpenRouter model was not found. Check OPEN_ROUTER_AI_MODEL in your environment.",
    };
  }

  return {
    status: 500,
    reply: "The AI service failed to respond. Please try again shortly.",
  };
}

// Next.js runs this function when the frontend calls /api/chat.
export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  // This endpoint only accepts chat messages sent from the frontend with POST.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ reply: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: API Key is missing from environment variables!");
    return res.status(500).json({ reply: "API key configuration error. Check OPEN_ROUTER_AI_API_KEY in your .env.local file." });
  }

  const message = req.body?.message;
  const chatId = req.body?.chatId;
  const conversationHistory = getConversationHistory(req.body?.history);

  // Next.js parses JSON request bodies for API routes, but we still validate the shape.
  // This prevents empty prompts or non-string values from being sent to OpenRouter.
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ reply: "No message provided." });
  }

  if (chatId !== undefined && typeof chatId !== "string") {
    return res.status(400).json({ reply: "Invalid chat id." });
  }

  // OpenRouter uses an OpenAI-compatible API, so the official OpenAI client can call it.
  const openRouter = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      // OpenRouter uses these optional headers for app attribution/rankings.
      "HTTP-Referer": process.env.OPEN_ROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPEN_ROUTER_APP_NAME ?? "BrainRot Chat",
    },
  });

  let accessToken: string | undefined;
  let saveError: string | undefined;

  if (
    req.cookies["sb-access-token"] ||
    req.cookies["sb-refresh-token"]
  ) {
    try {
      const auth = await getAuthedUserFromRequest(req, res);
      accessToken = auth.accessToken;
    } catch {
      saveError = "Log in to save this chat to your history.";
    }
  } else {
    saveError = "Log in to save this chat to your history.";
  }

  let stream;

  try {
    stream = await openRouter.chat.completions.create({
      model: process.env.OPEN_ROUTER_AI_MODEL ?? process.env.OPENROUTER_MODEL ?? "openrouter/auto",
      messages: [
        {
          role: "system",
          content:
            "Use the recent conversation for context. Answer directly and do not repeat earlier information unless it is useful.",
        },
        ...conversationHistory,
        {
          role: "user",
          content: message.trim(),
        },
      ],
      stream: true,
    });
  } catch (error: unknown) {
    const userError = getUserFacingError(error);

    // Log details on the server for debugging, but return only a safe message to the client.
    console.error("--- OPENROUTER ERROR START ---");
    console.error("Status:", getErrorStatus(error));
    console.error("Message:", getErrorMessage(error));
    console.error("--- OPENROUTER ERROR END ---");

    return res.status(userError.status).json({ reply: userError.reply });
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let reply = "";

  try {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;

      if (text) {
        reply += text;
        writeStreamEvent(res, { type: "delta", text });
      }
    }

    if (!reply) {
      throw new Error("OpenRouter returned an empty response.");
    }

    let savedChatId: string | undefined;

    if (accessToken) {
      try {
        const savedChat = await persistChatMessages({
          accessToken,
          chatId,
          prompt: message.trim(),
          reply,
        });
        savedChatId = savedChat.chatId;
      } catch (error: unknown) {
        const persistenceError = getErrorMessage(error);

        console.error("--- CHAT PERSISTENCE ERROR START ---");
        console.error("Message:", persistenceError);
        console.error("Error:", error);
        console.error("--- CHAT PERSISTENCE ERROR END ---");

        saveError =
          process.env.NODE_ENV === "production"
            ? "The AI replied, but the chat could not be saved."
            : persistenceError;
      }
    }

    writeStreamEvent(res, {
      type: "done",
      chatId: savedChatId,
      saveError,
    });
  } catch (error: unknown) {
    const userError = getUserFacingError(error);

    console.error("--- OPENROUTER STREAM ERROR START ---");
    console.error("Status:", getErrorStatus(error));
    console.error("Message:", getErrorMessage(error));
    console.error("--- OPENROUTER STREAM ERROR END ---");

    writeStreamEvent(res, {
      type: "error",
      message: userError.reply,
    });
  } finally {
    res.end();
  }
}
