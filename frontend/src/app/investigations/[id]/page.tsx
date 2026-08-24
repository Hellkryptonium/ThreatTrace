"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import type { AnalystVerdict, EnrichmentResult, Finding, RelayHop, ScoreExplanation, ThreatClassification, UrlIntelligence } from "@/lib/api/emails";

interface Investigation {
  analysisId: {
    riskScore: number;
    verdict: string;
    confidence: number;
    assessmentNote?: string;
    findings: Finding[];
    authentication: Record<string, string | undefined>;
    urlIntelligence?: UrlIntelligence[];
    relayPath?: RelayHop[];
    probableOriginIp?: string;
    enrichment?: EnrichmentResult;
    scoreExplanation?: ScoreExplanation[];
    analystVerdict?: AnalystVerdict;
    classification?: ThreatClassification;
    entities?: { emails: string[]; domains: string[]; urls: string[]; ips: string[]; attachments: string[] };
  };
  emailId: {
    sender: { email: string };
    subject: string;
    urls: string[];
    attachments: { filename: string; sha256: string }[];
  };
}

export default function InvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Investigation>();
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Investigation>(`/api/v1/investigations/${id}`)
      .then(setData)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load investigation."));
  }, [id]);

  if (error) return <main className="shell"><p className="error">{error}</p></main>;
  if (!data) return <main className="shell"><p className="kicker">LOADING INVESTIGATION...</p></main>;

  const { analysisId: analysis, emailId: email } = data;
  const urlIntelligence: UrlIntelligence[] = analysis.urlIntelligence ?? email.urls.map((url) => ({ url, domain: "unknown", category: "DIRECT" }));
  const relayPath = analysis.relayPath ?? [];
  const enrichment = analysis.enrichment;
  const scoreExplanation = analysis.scoreExplanation ?? [];
  const classification = analysis.classification;
  const entities = analysis.entities;
  const urlGroups = [...urlIntelligence.reduce((groups, item) => {
    const key = `${item.category}:${item.domain}`;
    const group = groups.get(key) ?? { ...item, urls: [] as string[] };
    group.urls.push(item.url);
    groups.set(key, group);
    return groups;
  }, new Map<string, UrlIntelligence & { urls: string[] }>()).values()];

  return (
    <main className="shell investigation">
      <header className="topbar"><span className="eyebrow">THREATTRACE / INVESTIGATION</span><a href="/analyze/upload">+ NEW ANALYSIS</a></header>
      <section className="result-head">
        <p className="kicker">INVESTIGATION COMPLETE</p>
        <div className="score"><strong>{analysis.riskScore}</strong><span>/ 100<br />RISK SCORE</span></div>
        <h1 className={`verdict ${analysis.verdict.toLowerCase()}`}>{analysis.verdict}</h1>
        <p className="confidence">Confidence: {Math.round(analysis.confidence * 100)}%</p>
        <p className="subject">{email.subject || "Untitled message"}</p>
        <p className="mono">FROM {email.sender.email}</p>
        {analysis.assessmentNote && <p className="assessment-note">{analysis.assessmentNote}</p>}
      </section>
      <section className="grid">
        <div>
          <h2>Primary findings</h2>
          {analysis.findings.length ? analysis.findings.map((item) => (
            <article className="finding" key={item.id}>
              <div><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span><h3>{item.title}</h3><p>{item.description}</p></div>
              <div className="evidence">{item.evidence.map((evidence) => <p key={`${evidence.field}-${evidence.value}`}><span>{evidence.field}</span><code>{evidence.value}</code></p>)}</div>
            </article>
          )) : <p className="muted">No suspicious indicators were detected by the current rules.</p>}
        </div>
        <aside>
          <h2>Why this score?</h2>
          {scoreExplanation.length ? scoreExplanation.map((item) => <p className="score-line" key={`${item.label}-${item.evidence ?? ""}`}><span>{item.status === "POSITIVE" ? "✓" : item.contribution ? "•" : "○"} {item.label}</span><strong>{item.contribution > 0 ? `+${item.contribution}` : item.contribution}</strong></p>) : <p className="muted">Score explanation is unavailable for this older analysis.</p>}
          {analysis.analystVerdict && <section className="analyst-verdict"><h2>Analyst verdict</h2><h3>{analysis.analystVerdict.headline}</h3><p>{analysis.analystVerdict.assessment}</p><strong>Supporting evidence</strong>{analysis.analystVerdict.supportingEvidence.map((item) => <p key={item}>✓ {item}</p>)}{analysis.analystVerdict.observations.length > 0 && <><strong>Minor observations</strong>{analysis.analystVerdict.observations.map((item) => <p key={item}>• {item}</p>)}</>}<strong>Recommended action</strong><p>{analysis.analystVerdict.recommendedAction}</p></section>}
          {classification && <section className="compact-section"><h2>Threat classification</h2>{Object.entries(classification).map(([key, value]) => <p className="classification-line" key={key}><span>{key.replaceAll(/([A-Z])/g, " $1")}</span><strong>{Math.round(value * 100)}%</strong></p>)}<p className="classification-note">Deterministic signals for triage, not scientifically validated probabilities.</p></section>}
          {entities && <section className="compact-section"><h2>Extracted entities</h2>{(["emails", "domains", "ips", "urls", "attachments"] as const).map((key) => <div className="entity-line" key={key}><span>{key}</span><strong>{entities[key].length}</strong><details><summary>View values</summary>{entities[key].map((value) => <code key={value}>{value}</code>)}</details></div>)}</section>}
          <h2>Authentication</h2>
          {Object.entries(analysis.authentication).map(([key, value]) => <p className="auth" key={key}><span>{key.toUpperCase()}</span><strong>{value ?? "NOT FOUND"}</strong></p>)}
          <h2>Mail route</h2>
          {analysis.probableOriginIp ? <p className="origin"><strong>{analysis.probableOriginIp}</strong><span>{email.sender.email.endsWith("@gmail.com") ? "Gmail relay infrastructure observed" : "Earliest public IP observed"}</span></p> : <p className="muted">No public origin IP could be established.</p>}
          {relayPath.map((hop) => <div className="relay-hop" key={hop.hop}><span>HOP {hop.hop}</span><code>{hop.ipAddresses.join(", ") || "No IP address"}</code></div>)}
          <p className="route-note">Relay data shows infrastructure reported by message headers. It does not prove a sender&apos;s physical location or identity.</p>
          <h2>Infrastructure enrichment</h2>
          {enrichment ? <>
            <p className="enrichment-note">Best-effort public lookups. Results are contextual evidence, not attribution.</p>
            {enrichment.ips.map((item) => <div className="enrichment-block" key={item.ip}><strong>{item.ip}</strong><span>{[item.city, item.region, item.country].filter(Boolean).join(", ") || "Location unavailable"}</span><span>{item.isp || item.organization || "Network unavailable"}{item.asn ? ` · ${item.asn}` : ""}</span></div>)}
            {enrichment.domains.map((item) => <div className="enrichment-block" key={item.domain}><strong>{item.domain}</strong><span>DNS: {item.dns.addresses.join(", ") || "No A record"}</span><span>MX: {item.dns.mx.join(", ") || "No MX record"}</span><span>Registrar: {item.rdap?.registrar || "Unavailable"}</span></div>)}
            {enrichment.urls.map((item) => <div className="enrichment-block" key={`${item.source}-${item.url}`}><strong>{item.source}</strong><span>{item.verdict || `Malicious: ${item.malicious ?? 0} · Suspicious: ${item.suspicious ?? 0}`}</span></div>)}
          </> : <p className="muted">Enrichment was not available for this analysis.</p>}
          <h2>URL intelligence</h2>
          {urlGroups.map((item) => <div className="url-item" key={`${item.category}-${item.domain}`}><span>{item.category.replaceAll("_", " ")} · {item.domain} · {item.urls.length} link{item.urls.length === 1 ? "" : "s"}</span><code>{item.category === "DIRECT" ? `${item.domain} (destination link)` : item.decodedTarget?.startsWith("http") ? item.decodedTarget : "Destination unavailable (encoded or obfuscated payload)"}</code><details><summary>View raw URL{item.urls.length === 1 ? "" : "s"}</summary>{item.urls.map((url) => <code key={url}>{url}</code>)}</details></div>)}
          <h2>Attachments</h2>
          {email.attachments.map((attachment) => <p className="attachment" key={attachment.sha256}>{attachment.filename}<br /><code>{attachment.sha256}</code></p>)}
        </aside>
      </section>
    </main>
  );
}
