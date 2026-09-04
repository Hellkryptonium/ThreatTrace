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

export interface EnrichmentResult {
  domains: { domain: string; dns: { addresses: string[]; mx: string[] }; rdap?: { registrar?: string; created?: string; expires?: string; status?: string[] } }[];
  ips: { ip: string; country?: string; region?: string; city?: string; isp?: string; organization?: string; asn?: string }[];
  urls: { url: string; source: string; verdict?: string; malicious?: number; suspicious?: number; permalink?: string }[];
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