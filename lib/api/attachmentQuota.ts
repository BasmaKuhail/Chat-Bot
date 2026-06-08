import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatAttachment } from "@/types/messages";

type QuotaClaim = {
  allowed: boolean;
  claimedAt?: string;
  nextAvailableAt: string;
};

type AttachmentTokenPayload = {
  userId: string;
  attachmentHashes: string[];
  expiresAt: number;
};

type AttachmentContent = Pick<
  ChatAttachment,
  "name" | "kind" | "mimeType" | "dataUrl" | "text"
>;

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

function getTokenSecret() {
  const secret =
    process.env.ATTACHMENT_TOKEN_SECRET ?? process.env.OPENROUTER_API_KEY;

  if (!secret) {
    throw new Error("Attachment token secret is not configured.");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function hashAttachment(attachment: AttachmentContent) {
  return createHash("sha256")
    .update(attachment.name)
    .update("\0")
    .update(attachment.kind)
    .update("\0")
    .update(attachment.mimeType)
    .update("\0")
    .update(attachment.dataUrl ?? attachment.text ?? "")
    .digest("base64url");
}

export function createAttachmentContextToken(
  userId: string,
  attachments: AttachmentContent[]
) {
  const payload: AttachmentTokenPayload = {
    userId,
    attachmentHashes: attachments.map(hashAttachment),
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAttachmentContextToken(
  token: string,
  userId: string,
  attachments: AttachmentContent[]
) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as AttachmentTokenPayload;
    const hashes = attachments.map(hashAttachment);

    return (
      payload.userId === userId &&
      payload.expiresAt > Date.now() &&
      payload.attachmentHashes.length === hashes.length &&
      payload.attachmentHashes.every((hash, index) => hash === hashes[index])
    );
  } catch {
    return false;
  }
}

export async function claimAttachmentCredit(
  supabase: SupabaseClient
): Promise<QuotaClaim> {
  const { data, error } = await supabase.rpc("claim_attachment_daily_credit");

  if (error) {
    if (
      error.code === "PGRST202" ||
      error.code === "42883" ||
      error.message.includes("claim_attachment_daily_credit")
    ) {
      throw new Error(
        "Attachment quota database migration has not been applied."
      );
    }

    throw new Error(`Attachment quota is unavailable: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (
    !result ||
    typeof result.allowed !== "boolean" ||
    typeof result.next_available_at !== "string"
  ) {
    throw new Error("Attachment quota returned an invalid response.");
  }

  return {
    allowed: result.allowed,
    claimedAt:
      typeof result.claimed_at === "string" ? result.claimed_at : undefined,
    nextAvailableAt: result.next_available_at,
  };
}

export async function releaseAttachmentCredit(
  supabase: SupabaseClient,
  claimedAt: string
) {
  const { error } = await supabase.rpc("release_attachment_daily_credit", {
    claim_time: claimedAt,
  });

  if (error) {
    console.error("Attachment credit refund failed:", error.message);
  }
}
