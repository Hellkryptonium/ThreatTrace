import dns from "node:dns/promises";
import { env } from "../../config/env.js";
import type { DomainEnrichment, EnrichmentProviderStatus, EnrichmentResult, IpEnrichment, NormalizedEmail, UrlReputation } from "../../types/email.js";

const timeout = 5000;
const reputationLimit = 10;

async function getJson<T>(url: string, headers?: HeadersInit): Promise<T | undefined> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
    return response.ok ? await response.json() as T : undefined;
  } catch { return undefined; }
}

async function enrichDomain(domain: string): Promise<DomainEnrichment> {
  const [addresses, mx, rdap] = await Promise.all([
    dns.resolve4(domain).catch(() => [] as string[]),
    dns.resolveMx(domain).then((records) => records.sort((a, b) => a.priority - b.priority).map((record) => record.exchange)).catch(() => [] as string[]),
    getJson<{ ldhName?: string; events?: { eventAction?: string; eventDate?: string }[]; entities?: { roles?: string[]; vcardArray?: [string, { value?: string }[]][] }[]; status?: string[] }>(`https://rdap.org/domain/${encodeURIComponent(domain)}`),
  ]);
  const registrar = rdap?.entities?.find((entity) => entity.roles?.includes("registrar"))?.vcardArray?.find((item) => item[0] === "fn")?.[1]?.find((field) => field.value)?.value;
  const event = (action: string) => rdap?.events?.find((item) => item.eventAction === action)?.eventDate;
  return { domain, dns: { addresses, mx }, rdap: rdap ? { registrar, created: event("registration"), expires: event("expiration"), status: rdap.status } : undefined };
}

async function enrichIp(ip: string): Promise<IpEnrichment> {
  const result = await getJson<{ status?: string; query?: string; country?: string; regionName?: string; city?: string; isp?: string; org?: string; as?: string }>(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,query,country,regionName,city,isp,org,as`);
  return { ip, country: result?.country, region: result?.regionName, city: result?.city, isp: result?.isp, organization: result?.org, asn: result?.as };
}

interface ReputationResult {
  results: UrlReputation[];
  virusTotal: { succeeded: boolean; message?: string };
  urlScan: { succeeded: boolean; message?: string };
}

async function reputation(url: string): Promise<ReputationResult> {
  const results: UrlReputation[] = [];
  const virusTotal = { succeeded: false } as ReputationResult["virusTotal"];
  const urlScan = { succeeded: false } as ReputationResult["urlScan"];
  if (env.VIRUSTOTAL_API_KEY) {
    const id = Buffer.from(url).toString("base64url").replace(/=+$/, "");
    const result = await getJson<{ data?: { attributes?: { last_analysis_stats?: { malicious?: number; suspicious?: number } } } }>(`https://www.virustotal.com/api/v3/urls/${id}`, { "x-apikey": env.VIRUSTOTAL_API_KEY });
    const stats = result?.data?.attributes?.last_analysis_stats;
    if (stats) {
      virusTotal.succeeded = true;
      results.push({ url, source: "VirusTotal", malicious: stats.malicious, suspicious: stats.suspicious, permalink: `https://www.virustotal.com/gui/url/${id}` });
    } else virusTotal.message = "URL was not found in VirusTotal or the request failed.";
  }
  if (env.URLSCAN_API_KEY) {
    const result = await getJson<{ results?: { task?: { uuid?: string }; page?: { domain?: string } }[] }>(`https://urlscan.io/api/v1/search/?q=page.url:${encodeURIComponent(url)}`, { "API-Key": env.URLSCAN_API_KEY });
    const match = result?.results?.[0];
    if (match) {
      urlScan.succeeded = true;
      results.push({ url, source: "URLScan", verdict: match.page?.domain ? `Observed at ${match.page.domain}` : "Observed", permalink: match.task?.uuid ? `https://urlscan.io/result/${match.task.uuid}/` : undefined });
    } else urlScan.message = "No URLScan observation was found or the request failed.";
  }
  return { results, virusTotal, urlScan };
}

export async function enrichEmail(email: NormalizedEmail, probableOriginIp?: string): Promise<EnrichmentResult> {
  const domains = new Set<string>();
  for (const address of [email.sender.email, email.replyTo, email.returnPath]) {
    const value = address?.replace(/[<>]/g, "").split("@")[1]?.toLowerCase();
    if (value) domains.add(value);
  }
  const urlValues = email.urls.slice(0, 30);
  const urlDomains = urlValues.flatMap((url) => { try { return [new URL(url).hostname]; } catch { return []; } });
  urlDomains.forEach((domain) => domains.add(domain));
  const reputationUrls = urlValues.filter((url) => { try { return new URL(url).protocol === "http:" || new URL(url).protocol === "https:"; } catch { return false; } }).slice(0, reputationLimit);
  const reputationResults = await Promise.all(reputationUrls.map(reputation));
  const providerStatus = (provider: "virusTotal" | "urlScan", configured: boolean): EnrichmentProviderStatus => {
    const outcomes = reputationResults.map((item) => item[provider]);
    const succeeded = outcomes.filter((item) => item.succeeded).length;
    const failed = outcomes.length - succeeded;
    const firstMessage = outcomes.find((item) => item.message)?.message;
    return { configured, checked: outcomes.length, succeeded, failed, ...(firstMessage ? { message: firstMessage } : {}) };
  };
  const [domainResults, ipResults] = await Promise.all([
    Promise.all([...domains].map(enrichDomain)),
    probableOriginIp ? enrichIp(probableOriginIp).then((value) => [value]) : Promise.resolve([] as IpEnrichment[]),
  ]);
  return {
    domains: domainResults,
    ips: ipResults,
    urls: reputationResults.flatMap((item) => item.results),
    providers: {
      virusTotal: providerStatus("virusTotal", Boolean(env.VIRUSTOTAL_API_KEY)),
      urlScan: providerStatus("urlScan", Boolean(env.URLSCAN_API_KEY)),
    },
    completedAt: new Date().toISOString(),
  };
}