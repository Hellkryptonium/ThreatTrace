import { simpleParser } from "mailparser";
import type { AddressObject, EmailAddress } from "mailparser";
import crypto from "node:crypto";
import type { NormalizedEmail } from "../../types/email.js";

const urlPattern = /https?:\/\/[^\s<>"']+/gi;
const forwardedPattern = /(^|\n)\s*-{2,}\s*forwarded message\s*-{2,}/i;
const forwardedHeaderPattern = /^(From|To|Date|Subject|Reply-To):\s*(.+)$/gim;
const ignoredDocumentUrls = new Set(["http://www.w3.org/TR/html4/loose.dtd", "http://www.w3.org/1999/a"]);

function headerValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return value == null ? undefined : String(value);
}

export async function parseEml(buffer: Buffer): Promise<NormalizedEmail> {
  function addressValues(value: AddressObject | AddressObject[] | undefined): EmailAddress[] {
    if (!value) return [];
    return Array.isArray(value) ? value.flatMap((item) => item.value) : value.value;
  }

  const parsed = await simpleParser(buffer);
  const body = [parsed.text ?? "", parsed.html ?? ""].join(" ");
  const urls = [...new Set((body.match(urlPattern) ?? []).map((url) => url.replace(/[),.;]+$/, "")).filter((url) => !ignoredDocumentUrls.has(url)))];
  const headers: Record<string, string | string[]> = {};
  const receivedHeaders: string[] = [];
  const forwardedHeaders: Record<string, string> = {};
  for (const [key, value] of parsed.headers) {
    const normalized = headerValue(value);
    if (normalized) headers[key.toLowerCase()] = normalized;
    if (key.toLowerCase() === "received") receivedHeaders.push(...(Array.isArray(value) ? value.map(String) : [String(value)]));
  }

  return {
    messageId: parsed.messageId,
    sender: { name: parsed.from?.value[0]?.name || undefined, email: parsed.from?.value[0]?.address ?? "" },
    recipients: addressValues(parsed.to).map(({ name, address }) => ({ name: name || undefined, email: address ?? "" })),
    cc: addressValues(parsed.cc).map(({ name, address }) => ({ name: name || undefined, email: address ?? "" })),
    subject: parsed.subject ?? "",
    date: parsed.date,
    headers,
    text: parsed.text,
    html: typeof parsed.html === "string" ? parsed.html : undefined,
    urls,
    attachments: parsed.attachments.map((attachment) => ({
      filename: attachment.filename ?? "attachment",
      contentType: attachment.contentType,
      size: attachment.size,
      sha256: crypto.createHash("sha256").update(attachment.content).digest("hex"),
    })),
    replyTo: parsed.replyTo?.value[0]?.address,
    returnPath: headerValue(parsed.headers.get("return-path")),
    forwarded: forwardedPattern.test(parsed.text ?? ""),
    forwardedHeaders: Object.fromEntries([...((parsed.text ?? "").matchAll(forwardedHeaderPattern))].map((match) => [match[1].toLowerCase(), match[2].trim()])),
    receivedHeaders,
    source: "EML",
  };
}