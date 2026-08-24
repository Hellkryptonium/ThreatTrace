import { describe, expect, it } from "vitest";
import { analyzeEmail } from "../src/services/analysis/analyze-email.js";
import type { NormalizedEmail } from "../src/types/email.js";

const baseEmail: NormalizedEmail = {
  sender: { email: "alerts@trusted.example" },
  recipients: [{ email: "analyst@example.net" }],
  subject: "Test",
  headers: {},
  urls: [],
  attachments: [],
  source: "EML",
};

describe("analyzeEmail", () => {
  it("returns SAFE when no rules produce findings", () => {
    const result = analyzeEmail(baseEmail);
    expect(result).toMatchObject({ riskScore: 0, verdict: "SAFE", confidence: 0.72 });
    expect(result.findings).toHaveLength(0);
  });

  it("produces evidence-backed findings and a deterministic critical verdict", () => {
    const result = analyzeEmail({
      ...baseEmail,
      replyTo: "recovery@untrusted.example",
      headers: {
        "received-spf": "FAIL",
        "authentication-results": "spf=fail dkim=fail dmarc=fail",
      },
      urls: ["http://192.0.2.10/verify", "https://bit.ly/fixture-link"],
    });

    expect(result.riskScore).toBe(60);
    expect(result.verdict).toBe("HIGH");
    expect(result.findings.map((finding) => finding.type)).toEqual([
      "REPLY_TO_MISMATCH",
      "AUTHENTICATION_FAILURE",
      "IP_BASED_URL",
      "URL_SHORTENER",
    ]);
    expect(result.findings.every((finding) => finding.evidence.length > 0)).toBe(true);
  });

  it("detects a Return-Path mismatch when Reply-To is absent", () => {
    const result = analyzeEmail({ ...baseEmail, returnPath: "mailer@untrusted.example" });
    expect(result.riskScore).toBe(10);
    expect(result.verdict).toBe("LOW");
    expect(result.confidence).toBe(0.7);
    expect(result.findings[0]?.type).toBe("RETURN_PATH_MISMATCH");
    expect(result.findings[0]?.severity).toBe("LOW");
  });

  it("does not score a Reply-To variation within the same organization", () => {
    const result = analyzeEmail({ ...baseEmail, sender: { email: "noreply@rmt.flipkart.com" }, replyTo: "noreply@flipkart.com", headers: { "received-spf": "PASS", "authentication-results": "spf=pass dkim=pass dmarc=pass" } });
    expect(result.riskScore).toBe(0);
    expect(result.verdict).toBe("SAFE");
    expect(result.findings[0]?.severity).toBe("INFO");
    expect(result.scoreExplanation[0]).toMatchObject({ label: "Same organizational domain", contribution: 0 });
    expect(result.entities.domains).toEqual(expect.arrayContaining(["rmt.flipkart.com", "flipkart.com"]));
    expect(result.classification.legitimate).toBe(0.79);
  });

  it("treats forwarded mail and tracking redirects as context, not proof of phishing", () => {
    const result = analyzeEmail({ ...baseEmail, forwarded: true, urls: ["https://fpktrans.sendclean.net/c/?u=encoded-destination"] });
    expect(result.riskScore).toBe(0);
    expect(result.verdict).toBe("INCONCLUSIVE");
    expect(result.confidence).toBe(0.55);
    expect(result.findings.map((finding) => finding.type)).toEqual(["FORWARDED_MESSAGE", "TRACKING_REDIRECT"]);
    expect(result.findings[1]?.evidence).toEqual(expect.arrayContaining([{ field: "linkCount", value: "1" }]));
  });

  it("identifies the earliest public IP from Received headers", () => {
    const result = analyzeEmail({ ...baseEmail, receivedHeaders: ["from relay.example (203.0.113.20) by mx.example (10.0.0.2)", "from source.example (198.51.100.7) by relay.example (203.0.113.20)"] });
    expect(result.relayPath).toHaveLength(2);
    expect(result.probableOriginIp).toBe("198.51.100.7");
  });

  it("ignores invalid leading-zero IP tokens", () => {
    const result = analyzeEmail({ ...baseEmail, receivedHeaders: ["from relay.example (08.23.08.18) by mx.example (10.0.0.2)"] });
    expect(result.relayPath[0]?.ipAddresses).toEqual(["10.0.0.2"]);
    expect(result.probableOriginIp).toBeUndefined();
  });
});
