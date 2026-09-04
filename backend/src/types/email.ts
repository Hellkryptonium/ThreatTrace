export type EmailSource = "EML" | "GMAIL";
export type ThreatVerdict = "SAFE" | "INCONCLUSIVE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FindingSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NormalizedAttachment {
  filename: string;
  contentType: string;
  size: number;
  sha256: string;
}

export interface NormalizedEmail {
  messageId?: string;
  sender: { name?: string; email: string };
  recipients: { name?: string; email: string }[];
  cc?: { name?: string; email: string }[];
  subject: string;
  date?: Date;
  headers: Record<string, string | string[]>;
  text?: string;
  html?: string;
  urls: string[];
  attachments: NormalizedAttachment[];
  replyTo?: string;
  returnPath?: string;
  forwarded?: boolean;
  forwardedHeaders?: Record<string, string>;
  receivedHeaders?: string[];
  source: EmailSource;
}

export interface Evidence {
  field: string;
  value: string;
  expected?: string;
  source?: string;
}

export interface Finding {
  id: string;
  type: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence: Evidence[];
  scoreContribution: number;
}

export interface ScoreExplanation {
  label: string;
  contribution: number;
  status: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  evidence?: string;
}

export interface AnalysisResult {
  riskScore: number;
  verdict: ThreatVerdict;
  confidence: number;
  findings: Finding[];
  authentication: { spf?: string; dkim?: string; dmarc?: string };
  assessmentNote?: string;
  urlIntelligence: UrlIntelligence[];
  relayPath: RelayHop[];
  probableOriginIp?: string;
  enrichment: EnrichmentResult;
  scoreExplanation: ScoreExplanation[];
  analystVerdict: {
    headline: string;
    assessment: string;
    supportingEvidence: string[];
    observations: string[];
    recommendedAction: string;
  };
  classification: ThreatClassification;
  entities: ExtractedEntities;
  mlAssistance?: MlAssistance;
}

export interface MlContribution {
  feature: string;
  impact: number;
  direction: "UP" | "DOWN";
  evidence?: string;
}

export interface MlAssistance {
  available: boolean;
  modelVersion?: string;
  mlRiskScore?: number;
  mlConfidence?: number;
  uncertainty?: number;
  effectiveWeight?: number;
  deterministicRiskScore?: number;
  deterministicConfidence?: number;
  topContributors?: MlContribution[];
  latencyMs?: number;
  reason?: string;
}

export interface ThreatClassification {
  phishing: number;
  businessEmailCompromise: number;
  credentialHarvesting: number;
  malware: number;
  invoiceFraud: number;
  spamMarketing: number;
  legitimate: number;
}

export interface ExtractedEntities {
  emails: string[];
  domains: string[];
  urls: string[];
  ips: string[];
  attachments: string[];
}

export interface RelayHop {
  hop: number;
  value: string;
  ipAddresses: string[];
}

export interface UrlIntelligence {
  url: string;
  domain: string;
  category: "DIRECT" | "TRACKING_REDIRECT" | "SHORTENER" | "IP_ADDRESS";
  decodedTarget?: string;
}

export interface EnrichmentResult {
  domains: DomainEnrichment[];
  ips: IpEnrichment[];
  urls: UrlReputation[];
  completedAt: string;
}

export interface DomainEnrichment {
  domain: string;
  dns: { addresses: string[]; mx: string[] };
  rdap?: { registrar?: string; created?: string; expires?: string; status?: string[] };
}

export interface IpEnrichment {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  organization?: string;
  asn?: string;
}

export interface UrlReputation {
  url: string;
  source: "VirusTotal" | "URLScan";
  verdict?: string;
  malicious?: number;
  suspicious?: number;
  permalink?: string;
}