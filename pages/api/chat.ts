import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

// The JSON shape this API route sends back to the frontend.
// ChatContainer expects a "reply" string and displays it in the chat.
type ChatResponse = {
  reply: string;
};

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

  // 429 usually means the account/key has hit a request limit or quota limit.
  if (status === 429 || message.includes("Too Many Requests") || message.includes("rate limit")) {
    return {
      status: 429,
      reply: "OpenRouter rate limit or quota was reached. Check your OpenRouter credits, key limit, or selected model.",
    };
  }

  // 401/403 usually means the API key is missing, wrong, disabled, or not allowed.
  if (status === 401 || status === 403) {
    return {
      status,
      reply: "OpenRouter authentication failed. Check that OPEN_ROUTER_AI_API_KEY is valid and has access to the selected model.",
    };
  }

  // OpenRouter returns 402 when the selected model needs credits the account does not have.
  if (status === 402) {
    return {
      status,
      reply: "OpenRouter rejected the request because the account has insufficient credits for the selected model.",
    };
  }

  // 404 can happen when OPEN_ROUTER_AI_MODEL is misspelled or unavailable.
  if (status === 404) {
    return {
      status,
      reply: "The selected OpenRouter model was not found. Check OPEN_ROUTER_AI_MODEL in your environment.",
    };
  }

  // Fallback for unexpected errors.
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

  // Keep the API key on the server. It should never be sent to browser code.
  // The second variable name is a fallback in case you prefer OpenRouter's common env name.
  const apiKey = process.env.OPEN_ROUTER_AI_API_KEY ?? process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: API Key is missing from environment variables!");
    return res.status(500).json({ reply: "API key configuration error. Check OPEN_ROUTER_AI_API_KEY in your .env.local file." });
  }

  const message = req.body?.message;

  // Next.js parses JSON request bodies for API routes, but we still validate the shape.
  // This prevents empty prompts or non-string values from being sent to OpenRouter.
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ reply: "No message provided." });
  }

  try {
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

    // Send the user's prompt to the selected model and read the first assistant response.
    // "openrouter/auto" lets OpenRouter choose a model if you do not set one in .env.local.
    const completion = await openRouter.chat.completions.create({
      model: process.env.OPEN_ROUTER_AI_MODEL ?? process.env.OPENROUTER_MODEL ?? "openrouter/auto",
      messages: [
        {
          role: "user",
          content: message.trim(),
        },
      ],
    });
    const text = completion.choices[0]?.message?.content;

    // If OpenRouter responds but does not include text, treat it as a bad upstream response.
    if (!text) {
      return res.status(502).json({ reply: "OpenRouter returned an empty response." });
    }

    // Successful path: send the assistant text back to the frontend.
    return res.status(200).json({ reply: text });
  } catch (error: unknown) {
    const userError = getUserFacingError(error);

    // Log details on the server for debugging, but return only a safe message to the client.
    console.error("--- OPENROUTER ERROR START ---");
    console.error("Status:", getErrorStatus(error));
    console.error("Message:", getErrorMessage(error));
    console.error("--- OPENROUTER ERROR END ---");

    return res.status(userError.status).json({ reply: userError.reply });
  }
}
