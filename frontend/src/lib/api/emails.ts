import { apiRequest } from "./client";

export interface UploadResponse {
  id: string;
  status: "COMPLETED";
  analysis: {
    riskScore: number;
    verdict: string;
    confidence: number;
    assessmentNote?: string;
    findings: Finding[];
    authentication: Record<string, string | undefined>;
  };
}

export interface Finding {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  evidence: { field: string; value: string; expected?: string }[];
  scoreContribution: number;
}

export function uploadEmail(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<UploadResponse>("/api/v1/emails/upload", { method: "POST", body: formData });
}

export interface UrlIntelligence {
  url: string;
  domain: string;
  category: string;
  decodedTarget?: string;
}

export interface RelayHop {
  hop: number;
  value: string;
  ipAddresses: string[];
}

export interface IpReputation {
  ip: string;
  source: "AbuseIPDB";
  abuseConfidenceScore: number;
  totalReports: number;
  isWhitelisted: boolean;
  isp?: string;
  usageType?: string;
  countryCode?: string;
  domain?: string;
  lastReportedAt?: string;
  permalink?: string;
}

export interface IpRdap {
  networkName?: string;
  handle?: string;
  startAddress?: string;
  endAddress?: string;
  registrant?: string;
  abuseContact?: string;
  country?: string;
  registered?: string;
  lastChanged?: string;
  permalink?: string;
}

export interface IpEnrichment {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  organization?: string;
  asn?: string;
  source?: "ipwho.is";
  retrievedAt?: string;
  rdap?: IpRdap;
  reputation?: IpReputation;
}

export interface DomainEnrichment {
  domain: string;
  dns: { addresses: string[]; mx: string[] };
  rdap?: { registrar?: string; created?: string; expires?: string; status?: string[]; permalink?: string };
}

export interface UrlEnrichment {
  url: string;
  source: string;
  verdict?: string;
  malicious?: number;
  suspicious?: number;
  permalink?: string;
}

export interface EnrichmentProviderStatus {
  configured: boolean;
  checked: number;
  succeeded: number;
  failed: number;
  message?: string;
}

export interface EnrichmentResult {
  domains: DomainEnrichment[];
  ips: IpEnrichment[];
  urls: UrlEnrichment[];
  providers?: {
    virusTotal?: EnrichmentProviderStatus;
    urlScan?: EnrichmentProviderStatus;
    abuseIpDb?: EnrichmentProviderStatus;
    rdap?: EnrichmentProviderStatus;
  };
}

export interface ScoreExplanation { label: string; contribution: number; status: string; evidence?: string; }
export interface AnalystVerdict { headline: string; assessment: string; supportingEvidence: string[]; observations: string[]; recommendedAction: string; }
export interface ThreatClassification { phishing: number; businessEmailCompromise: number; credentialHarvesting: number; malware: number; invoiceFraud: number; spamMarketing: number; legitimate: number; }
export interface MlContributor { feature: string; impact: number; direction: "UP" | "DOWN"; evidence?: string; }
export interface MlAssistance {
  available: boolean;
  modelVersion?: string;
  mlRiskScore?: number;
  mlConfidence?: number;
  uncertainty?: number;
  effectiveWeight?: number;
  deterministicRiskScore?: number;
  deterministicConfidence?: number;
  topContributors?: MlContributor[];
  latencyMs?: number;
  reason?: string;
}