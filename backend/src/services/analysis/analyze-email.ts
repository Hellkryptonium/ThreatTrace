import crypto from "node:crypto";
import type { AnalysisResult, Finding, NormalizedEmail, ThreatVerdict, UrlIntelligence } from "../../types/email.js";
import { analyzeRoute } from "./route-forensics.js";

function domain(address?: string): string | undefined {
  return address?.split("@")[1]?.toLowerCase();
}

function organizationalDomain(value?: string): string | undefined {
  if (!value) return undefined;
  const labels = value.split(".").filter(Boolean);
  return labels.length >= 2 ? labels.slice(-2).join(".") : value;
}

function finding(type: string, severity: Finding["severity"], title: string, description: string, evidence: Finding["evidence"], scoreContribution: number): Finding {
  return { id: crypto.randomUUID(), type, severity, title, description, evidence, scoreContribution };
}

export function analyzeEmail(email: NormalizedEmail): AnalysisResult {
  const findings: Finding[] = [];
  const senderDomain = domain(email.sender.email);
  const replyDomain = domain(email.replyTo);
  const returnPathDomain = domain(email.returnPath?.replace(/^<|>$/g, ""));
  const scoreExplanation: AnalysisResult["scoreExplanation"] = [];
  const authentication = {
    spf: email.headers["received-spf"]?.toString().split(" ")[0]?.toUpperCase(),
    dkim: email.headers["authentication-results"]?.toString().match(/dkim=([a-z]+)/i)?.[1]?.toUpperCase(),
    dmarc: email.headers["authentication-results"]?.toString().match(/dmarc=([a-z]+)/i)?.[1]?.toUpperCase(),
  };

  if (email.replyTo && senderDomain && replyDomain && senderDomain !== replyDomain) {
    const sameOrganization = organizationalDomain(senderDomain) === organizationalDomain(replyDomain);
    const contribution = sameOrganization ? 0 : 10;
    findings.push(finding("REPLY_TO_MISMATCH", sameOrganization ? "INFO" : "LOW", sameOrganization ? "Reply-To stays within the same organization" : "Reply-To domain differs from sender domain", sameOrganization ? "The exact subdomain differs, but both addresses belong to the same organizational domain." : "Replies would be sent to a different organizational domain than the visible sender.", [
      { field: "from", value: email.sender.email },
      { field: "replyTo", value: email.replyTo, expected: sameOrganization ? `same organizational domain as ${senderDomain}` : `same domain as ${senderDomain}` },
    ], contribution));
    scoreExplanation.push({ label: sameOrganization ? "Same organizational domain" : "Unrelated Reply-To domain", contribution, status: sameOrganization ? "NEUTRAL" : "NEGATIVE", evidence: `${senderDomain} / ${replyDomain}` });
  } else if (email.returnPath && senderDomain && returnPathDomain && senderDomain !== returnPathDomain) {
    const sameOrganization = organizationalDomain(senderDomain) === organizationalDomain(returnPathDomain);
    const contribution = sameOrganization ? 0 : 10;
    findings.push(finding("RETURN_PATH_MISMATCH", sameOrganization ? "INFO" : "LOW", sameOrganization ? "Return-Path stays within the same organization" : "Return-Path domain differs from sender domain", sameOrganization ? "The return address differs by subdomain but remains within the same organizational domain." : "The delivery return address uses a different organizational domain than the visible sender.", [
      { field: "from", value: email.sender.email },
      { field: "returnPath", value: email.returnPath, expected: sameOrganization ? `same organizational domain as ${senderDomain}` : `same domain as ${senderDomain}` },
    ], contribution));
    scoreExplanation.push({ label: sameOrganization ? "Same organizational domain" : "Unrelated Return-Path domain", contribution, status: sameOrganization ? "NEUTRAL" : "NEGATIVE", evidence: `${senderDomain} / ${returnPathDomain}` });
  }
  if (email.forwarded) {
    findings.push(finding("FORWARDED_MESSAGE", "INFO", "Forwarded message detected", "The analyzed message contains a forwarded-message section; the original sender authentication cannot be verified from the outer message alone.", [
      { field: "body", value: "---------- Forwarded message ---------" },
    ], 0));
  }
  if ([authentication.spf, authentication.dkim, authentication.dmarc].includes("FAIL")) {
    findings.push(finding("AUTHENTICATION_FAILURE", "HIGH", "Email authentication failed", "At least one authentication check reported FAIL.", [
      { field: "authentication-results", value: email.headers["authentication-results"]?.toString() ?? "not present" },
    ], 25));
  }
  for (const [label, value] of [["SPF", authentication.spf], ["DKIM", authentication.dkim], ["DMARC", authentication.dmarc]] as const) {
    if (value === "PASS") scoreExplanation.push({ label: `${label} PASS`, contribution: 0, status: "POSITIVE" });
  }
  const trackingUrls: string[] = [];
  const urlIntelligence: UrlIntelligence[] = [];
  for (const url of email.urls) {
    try {
      const parsed = new URL(url);
      const category: UrlIntelligence["category"] = /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname) ? "IP_ADDRESS" : ["bit.ly", "tinyurl.com", "t.co", "goo.gl"].includes(parsed.hostname) ? "SHORTENER" : ["sendclean.net", "fpktrans.sendclean.net"].includes(parsed.hostname) ? "TRACKING_REDIRECT" : "DIRECT";
      const encodedTarget = parsed.searchParams.get("u");
      let decodedTarget: string | undefined;
      if (encodedTarget) {
        try { decodedTarget = decodeURIComponent(encodedTarget); } catch { decodedTarget = undefined; }
      }
      urlIntelligence.push({ url, domain: parsed.hostname, category, decodedTarget });
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
        findings.push(finding("IP_BASED_URL", "MEDIUM", "URL uses an IP address", "The message links directly to an IP address instead of a domain.", [{ field: "url", value: url }], 15));
      }
      if (["bit.ly", "tinyurl.com", "t.co", "goo.gl"].includes(parsed.hostname)) {
        findings.push(finding("URL_SHORTENER", "MEDIUM", "URL shortener detected", "The destination is obscured by a URL shortening service.", [{ field: "url", value: url }], 10));
      }
      if (["sendclean.net", "fpktrans.sendclean.net"].includes(parsed.hostname)) {
        trackingUrls.push(url);
      }
    } catch { /* URL extraction is intentionally tolerant of malformed body text. */ }
  }

  if (trackingUrls.length) {
    findings.push(finding("TRACKING_REDIRECT", "INFO", "Tracking redirects detected", `${trackingUrls.length} marketing redirect link${trackingUrls.length === 1 ? "" : "s"} may conceal the final destination.`, [{ field: "trackingDomain", value: "fpktrans.sendclean.net" }, { field: "linkCount", value: String(trackingUrls.length) }, { field: "destination", value: "Encoded or unavailable" }], 0));
    scoreExplanation.push({ label: "Tracking redirects", contribution: 0, status: "NEUTRAL", evidence: `${trackingUrls.length} link${trackingUrls.length === 1 ? "" : "s"}` });
  }

  const score = Math.min(100, findings.reduce((total, item) => total + item.scoreContribution, 0));
  const route = analyzeRoute(email);
  const verdict: ThreatVerdict = score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : score > 0 ? "LOW" : email.forwarded ? "INCONCLUSIVE" : "SAFE";
  const confidence = email.forwarded ? 0.55 : score >= 60 ? 0.9 : score >= 30 ? 0.82 : score > 0 ? 0.7 : 0.72;
  const analystVerdict = email.forwarded ? { headline: "INCONCLUSIVE", assessment: "The message contains a forwarded section, so the original sender and authentication cannot be independently verified.", supportingEvidence: ["Outer message evidence is limited by forwarding"], observations: ["Forwarded message detected"], recommendedAction: "Review the original message headers before taking action." } : { headline: score >= 60 ? "HIGH RISK" : score > 0 ? "LOW RISK" : "NO KNOWN THREATS", assessment: score > 0 ? "The available evidence shows a limited anomaly that does not independently confirm malicious activity." : "The available evidence does not show a confirmed malicious indicator.", supportingEvidence: scoreExplanation.filter((item) => item.status === "POSITIVE").map((item) => item.label), observations: findings.filter((item) => item.scoreContribution === 0).map((item) => item.title), recommendedAction: score >= 30 ? "Review the message and linked infrastructure before responding." : "No immediate action required." };
  return {
    riskScore: score,
    verdict,
    confidence,
    findings,
    authentication,
    enrichment: { domains: [], ips: [], urls: [], completedAt: new Date().toISOString() },
    urlIntelligence,
    assessmentNote: email.forwarded ? "This message was forwarded. The original sender and authentication could not be independently verified from the outer message." : undefined,
    ...route,
    scoreExplanation,
    analystVerdict,
    classification: {
      phishing: score >= 60 ? 0.7 : 0.02,
      businessEmailCompromise: /payment|invoice|wire transfer/i.test(`${email.subject} ${email.text ?? ""}`) ? 0.12 : 0.01,
      credentialHarvesting: /sign in|verify your account|password|credential/i.test(`${email.subject} ${email.text ?? ""}`) ? 0.18 : 0,
      malware: email.attachments.some((attachment) => /\.exe$|\.scr$|\.js$|\.vbs$/i.test(attachment.filename)) ? 0.25 : 0,
      invoiceFraud: /invoice|payment due|amount paid/i.test(`${email.subject} ${email.text ?? ""}`) ? 0.12 : 0,
      spamMarketing: trackingUrls.length > 0 ? 0.18 : 0.02,
      legitimate: authentication.spf === "PASS" && authentication.dkim === "PASS" && authentication.dmarc === "PASS" && score < 30 ? 0.79 : 0.2,
    },
    entities: {
      emails: [...new Set([email.sender.email, email.replyTo, email.returnPath, ...email.recipients.map((recipient) => recipient.email)].filter((value): value is string => Boolean(value)))],
      domains: [...new Set([senderDomain, replyDomain, returnPathDomain, ...urlIntelligence.map((item) => item.domain)].filter((value): value is string => Boolean(value)))],
      urls: email.urls,
      ips: [...new Set([route.probableOriginIp, ...route.relayPath.flatMap((hop) => hop.ipAddresses)].filter((value): value is string => Boolean(value)))],
      attachments: email.attachments.map((attachment) => attachment.sha256),
    },
  };
}