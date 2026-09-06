import dns from "node:dns/promises";
import { env } from "../../config/env.js";
import type { DomainEnrichment, EnrichmentProviderStatus, EnrichmentResult, IpEnrichment, IpRdap, IpReputation, NormalizedEmail, UrlReputation } from "../../types/email.js";
import { isPublicIpv4 } from "../analysis/route-forensics.js";

const timeout = 8000;
const reputationLimit = 10;
const ipLookupLimit = 10;
const ipCache = new Map<string, IpEnrichment>();

async function getJson<T>(url: string, headers?: HeadersInit): Promise<T | undefined> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ThreatTrace/1.0",
        "Accept": "application/json, application/rdap+json",
        ...headers,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
    });
    return response.ok ? await response.json() as T : undefined;
  } catch { return undefined; }
}

function extractVcardField(vcardArray: unknown, fieldName: string): string | undefined {
  if (!Array.isArray(vcardArray) || vcardArray.length < 2 || !Array.isArray(vcardArray[1])) return undefined;
  const properties = vcardArray[1] as unknown[];
  for (const prop of properties) {
    if (Array.isArray(prop) && prop[0] === fieldName) {
      if (Array.isArray(prop[1])) {
        const item = (prop[1] as { value?: string }[]).find((f) => f && typeof f.value === "string");
        if (item?.value) return item.value;
      }
      if (prop.length >= 4 && prop[3] !== undefined && prop[3] !== null) {
        return String(prop[3]);
      }
      if (typeof prop[1] === "object" && prop[1] !== null && "value" in prop[1]) {
        return String((prop[1] as { value?: unknown }).value);
      }
    }
  }
  return undefined;
}

export async function checkIpReputation(ip: string): Promise<IpReputation | undefined> {
  if (!env.ABUSEIPDB_API_KEY) return undefined;
  const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`;
  const result = await getJson<{
    data?: {
      ipAddress?: string;
      isPublic?: boolean;
      ipVersion?: number;
      isWhitelisted?: boolean;
      abuseConfidenceScore?: number;
      countryCode?: string;
      usageType?: string;
      isp?: string;
      domain?: string;
      totalReports?: number;
      numDistinctUsers?: number;
      lastReportedAt?: string;
    };
  }>(url, {
    Key: env.ABUSEIPDB_API_KEY,
    Accept: "application/json",
  });
  if (!result?.data) return undefined;
  const data = result.data;
  return {
    ip,
    source: "AbuseIPDB",
    abuseConfidenceScore: data.abuseConfidenceScore ?? 0,
    totalReports: data.totalReports ?? 0,
    isWhitelisted: Boolean(data.isWhitelisted),
    isp: data.isp,
    usageType: data.usageType,
    countryCode: data.countryCode,
    domain: data.domain,
    lastReportedAt: data.lastReportedAt,
    permalink: `https://www.abuseipdb.com/check/${encodeURIComponent(ip)}`,
  };
}

export async function lookupIpRdap(ip: string): Promise<IpRdap | undefined> {
  const data = await getJson<{
    name?: string;
    handle?: string;
    startAddress?: string;
    endAddress?: string;
    country?: string;
    events?: { eventAction?: string; eventDate?: string }[];
    entities?: Array<{
      roles?: string[];
      vcardArray?: unknown;
      entities?: Array<{ roles?: string[]; vcardArray?: unknown }>;
    }>;
  }>(`https://rdap.org/ip/${encodeURIComponent(ip)}`);
  if (!data) return undefined;
  const event = (action: string) => data.events?.find((item) => item.eventAction === action)?.eventDate;
  let registrant: string | undefined;
  let abuseContact: string | undefined;
  const allEntities = [...(data.entities ?? [])];
  for (const entity of data.entities ?? []) {
    if (entity.entities) allEntities.push(...entity.entities);
  }
  for (const entity of allEntities) {
    if (entity.roles?.includes("registrant") || entity.roles?.includes("administrative")) {
      const fn = extractVcardField(entity.vcardArray, "fn");
      if (fn && !registrant) registrant = fn;
    }
    if (entity.roles?.includes("abuse")) {
      const email = extractVcardField(entity.vcardArray, "email");
      if (email && !abuseContact) abuseContact = email;
    }
  }
  return {
    networkName: data.name,
    handle: data.handle,
    startAddress: data.startAddress,
    endAddress: data.endAddress,
    country: data.country,
    registrant,
    abuseContact,
    registered: event("registration"),
    lastChanged: event("last changed") || event("last update"),
    permalink: `https://rdap.org/ip/${encodeURIComponent(ip)}`,
  };
}

async function enrichDomain(domain: string): Promise<DomainEnrichment> {
  const [addresses, mx, rdap] = await Promise.all([
    dns.resolve4(domain).catch(() => [] as string[]),
    dns.resolveMx(domain).then((records) => records.sort((a, b) => a.priority - b.priority).map((record) => record.exchange)).catch(() => [] as string[]),
    getJson<{ ldhName?: string; events?: { eventAction?: string; eventDate?: string }[]; entities?: { roles?: string[]; vcardArray?: unknown }[]; status?: string[] }>(`https://rdap.org/domain/${encodeURIComponent(domain)}`),
  ]);
  const registrarEntity = rdap?.entities?.find((entity) => entity.roles?.includes("registrar"));
  const registrar = registrarEntity ? extractVcardField(registrarEntity.vcardArray, "fn") : undefined;
  const event = (action: string) => rdap?.events?.find((item) => item.eventAction === action)?.eventDate;
  return {
    domain,
    dns: { addresses, mx },
    rdap: rdap ? {
      registrar,
      created: event("registration"),
      expires: event("expiration"),
      status: rdap.status,
      permalink: `https://rdap.org/domain/${encodeURIComponent(domain)}`,
    } : undefined,
  };
}

async function enrichIp(ip: string): Promise<IpEnrichment> {
  const cached = ipCache.get(ip);
  if (cached) return cached;
  const [result, rdap, reputation] = await Promise.all([
    getJson<{ success?: boolean; country?: string; region?: string; city?: string; latitude?: number; longitude?: number; connection?: { isp?: string; org?: string; asn?: number | string } }>(`https://ipwho.is/${encodeURIComponent(ip)}`),
    lookupIpRdap(ip),
    checkIpReputation(ip),
  ]);
  const enrichment: IpEnrichment = {
    ip,
    country: result?.country || rdap?.country,
    region: result?.region,
    city: result?.city,
    latitude: result?.latitude,
    longitude: result?.longitude,
    isp: result?.connection?.isp || rdap?.networkName || reputation?.isp,
    organization: result?.connection?.org || rdap?.registrant,
    asn: result?.connection?.asn ? String(result.connection.asn) : undefined,
    source: "ipwho.is",
    retrievedAt: new Date().toISOString(),
    rdap,
    reputation,
  };
  ipCache.set(ip, enrichment);
  return enrichment;
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

export async function enrichEmail(email: NormalizedEmail, probableOriginIp?: string, relayIps: string[] = []): Promise<EnrichmentResult> {
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
  const publicIps = [...new Set([probableOriginIp, ...relayIps].filter((ip): ip is string => ip !== undefined && isPublicIpv4(ip)))].slice(0, ipLookupLimit);
  const [domainResults, ipResults] = await Promise.all([
    Promise.all([...domains].map(enrichDomain)),
    Promise.all(publicIps.map(enrichIp)),
  ]);
  const abuseIpDbConfigured = Boolean(env.ABUSEIPDB_API_KEY);
  const abuseIpDbChecked = abuseIpDbConfigured ? ipResults.length : 0;
  const abuseIpDbSucceeded = ipResults.filter((item) => item.reputation).length;
  const rdapChecked = domainResults.length + ipResults.length;
  const rdapSucceeded = domainResults.filter((item) => item.rdap).length + ipResults.filter((item) => item.rdap).length;
  return {
    domains: domainResults,
    ips: ipResults,
    urls: reputationResults.flatMap((item) => item.results),
    providers: {
      virusTotal: providerStatus("virusTotal", Boolean(env.VIRUSTOTAL_API_KEY)),
      urlScan: providerStatus("urlScan", Boolean(env.URLSCAN_API_KEY)),
      abuseIpDb: {
        configured: abuseIpDbConfigured,
        checked: abuseIpDbChecked,
        succeeded: abuseIpDbSucceeded,
        failed: abuseIpDbChecked - abuseIpDbSucceeded,
        ...((!abuseIpDbConfigured) ? { message: "API key not configured." } : abuseIpDbChecked > 0 && abuseIpDbSucceeded === 0 ? { message: "No AbuseIPDB results were returned or the requests failed." } : {}),
      },
      rdap: {
        configured: true,
        checked: rdapChecked,
        succeeded: rdapSucceeded,
        failed: rdapChecked - rdapSucceeded,
        ...(rdapChecked > 0 && rdapSucceeded === 0 ? { message: "No RDAP records were returned or the lookups failed." } : {}),
      },
    },
    completedAt: new Date().toISOString(),
  };
}
