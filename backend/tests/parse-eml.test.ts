import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseEml } from "../src/services/email/parse-eml.js";

describe("parseEml", () => {
  it("normalizes headers, addresses, URLs, and attachment hashes", async () => {
    const fixture = await readFile(new URL("./fixtures/suspicious.eml", import.meta.url));
    const email = await parseEml(fixture);

    expect(email.source).toBe("EML");
    expect(email.sender.email).toBe("alerts@trusted.example");
    expect(email.recipients[0]?.email).toBe("analyst@example.net");
    expect(email.replyTo).toBe("recovery@untrusted.example");
    expect(email.headers["authentication-results"]).toContain("dmarc=fail");
    expect(email.urls).toEqual(["http://192.0.2.10/verify", "https://bit.ly/fixture-link"]);
    expect(email.attachments[0]).toMatchObject({ filename: "invoice.txt", size: 28 });
    expect(email.attachments[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves headers from a forwarded body", async () => {
    const email = await parseEml(Buffer.from("From: me@example.net\nTo: analyst@example.net\nSubject: Fwd\nContent-Type: text/plain\n\n---------- Forwarded message ---------\nFrom: Original Sender <original@example.com>\nSubject: Original subject\n\nOriginal body"));
    expect(email.forwarded).toBe(true);
    expect(email.forwardedHeaders).toMatchObject({ from: "Original Sender <original@example.com>", subject: "Original subject" });
  });
});
