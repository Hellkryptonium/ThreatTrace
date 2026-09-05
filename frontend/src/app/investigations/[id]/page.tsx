"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { AppHeader } from "@/components/app-header";
import styles from "./investigation.module.css";
import type { AnalystVerdict, EnrichmentResult, Finding, MlAssistance, RelayHop, ScoreExplanation, ThreatClassification, UrlIntelligence } from "@/lib/api/emails";
import { RouteMap, type RouteMapPoint } from "@/components/investigation/route-map";

interface Investigation {
  analysisId: {
    riskScore: number;
    verdict: string;
    confidence: number;
    assessmentNote?: string;
    findings: Finding[];
    authentication?: Record<string, string | undefined>;
    urlIntelligence?: UrlIntelligence[];
    relayPath?: RelayHop[];
    probableOriginIp?: string;
    enrichment?: EnrichmentResult;
    scoreExplanation?: ScoreExplanation[];
    analystVerdict?: AnalystVerdict;
    classification?: ThreatClassification;
    entities?: { emails: string[]; domains: string[]; urls: string[]; ips: string[]; attachments: string[] };
    mlAssistance?: MlAssistance;
  };
  emailId: {
    sender: { email: string };
    subject: string;
    urls: string[];
    attachments: { filename: string; sha256: string }[];
  };
}

type ReportSection = "findings" | "score" | "authentication" | "route" | "infrastructure" | "urls";

function routeMapPoints(relayPath: RelayHop[], ipResults: NonNullable<EnrichmentResult>["ips"], probableOriginIp?: string): RouteMapPoint[] {
  const locations = new Map(ipResults.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).map((item) => [item.ip, item]));
  const points: RouteMapPoint[] = [];
  const seen = new Set<string>();
  relayPath.forEach((hop) => hop.ipAddresses.forEach((ip) => {
    const location = locations.get(ip);
    if (!location || seen.has(ip)) return;
    seen.add(ip);
    points.push({ ip, hop: hop.hop, role: ip === probableOriginIp ? "ORIGIN" : "RELAY", city: location.city, region: location.region, country: location.country, latitude: location.latitude!, longitude: location.longitude!, isp: location.isp || location.organization, asn: location.asn });
  }));
  return points;
}

function EvidenceGraph({ sender, entities, relayPath }: { sender: string; entities?: Investigation["analysisId"]["entities"]; relayPath: RelayHop[] }) {
  const senderDomain = sender.split("@")[1] ?? "sender domain";
  const relayIp = relayPath.flatMap((hop) => hop.ipAddresses)[0];
  const nodes = [
    { label: "Email", value: sender, type: "email", position: "graphCenter" },
    { label: "Sender domain", value: senderDomain, type: "domain", position: "graphTop" },
    ...(relayIp ? [{ label: "Relay IP", value: relayIp, type: "ip", position: "graphLeft" }] : []),
    ...(entities?.urls[0] ? [{ label: "URL indicator", value: entities.urls[0], type: "url", position: "graphRight" }] : []),
    ...(entities?.attachments[0] ? [{ label: "Attachment hash", value: entities.attachments[0].slice(0, 18), type: "hash", position: "graphBottom" }] : []),
  ];
  return <section className={styles.graphPanel}><div className={styles.graphHeading}><div><p className="kicker">EVIDENCE MAP</p><h2>How this message connects</h2></div><span>{nodes.length} NODES · CORRELATED</span></div><div className={styles.evidenceGraph}>{relayIp && <div className={`${styles.graphConnector} ${styles.connectorLeft}`} />}{entities?.urls[0] && <div className={`${styles.graphConnector} ${styles.connectorRight}`} />}{entities?.attachments[0] && <div className={`${styles.graphConnector} ${styles.connectorBottom}`} />}<div className={`${styles.graphConnector} ${styles.connectorTop}`} />{nodes.map((node) => <div className={`${styles.graphNode} ${styles[node.position as keyof typeof styles]}`} key={`${node.type}-${node.value}`}><span className={`${styles.nodeIcon} ${styles[node.type]}`}>{node.type === "email" ? "@" : node.type === "ip" ? "#" : node.type === "hash" ? "◇" : "•"}</span><small>{node.label}</small><strong title={node.value}>{node.value}</strong></div>)}</div></section>;
}

export default function InvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Investigation>();
  const [user, setUser] = useState<CurrentUser>();
  const [openSection, setOpenSection] = useState<ReportSection>("score");
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => undefined);
    apiRequest<Investigation>(`/api/v1/investigations/${id}`)
      .then(setData)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load investigation."));
  }, [id]);

  if (error) return <main className={styles.shell}><p className="error">{error}</p></main>;
  if (!data) return <main className={styles.shell}><p className="kicker">LOADING INVESTIGATION...</p></main>;

  const { analysisId: analysis, emailId: email } = data;
  const urlIntelligence: UrlIntelligence[] = analysis.urlIntelligence ?? email.urls.map((url) => ({ url, domain: "unknown", category: "DIRECT" }));
  const relayPath = analysis.relayPath ?? [];
  const enrichment = analysis.enrichment;
  const scoreExplanation = analysis.scoreExplanation ?? [];
  const classification = analysis.classification;
  const entities = analysis.entities;
  const ml = analysis.mlAssistance;
  const authentication = analysis.authentication ?? { spf: undefined, dkim: undefined, dmarc: undefined };
  const mapPoints = routeMapPoints(relayPath, enrichment?.ips ?? [], analysis.probableOriginIp);
  const urlGroups = [...urlIntelligence.reduce((groups, item) => {
    const key = `${item.category}:${item.domain}`;
    const group = groups.get(key) ?? { ...item, urls: [] as string[] };
    group.urls.push(item.url);
    groups.set(key, group);
    return groups;
  }, new Map<string, UrlIntelligence & { urls: string[] }>()).values()];

  function openReportSection(section: ReportSection) {
    setOpenSection(section);
  }

  function copilotHref(prompt: string) {
    return `/copilot?${new URLSearchParams({ investigationId: id, prompt }).toString()}`;
  }

  return (
    <main className={`${styles.shell} ${styles.investigation}`}>
      <AppHeader user={user} actionHref="/analyze/upload" actionLabel="+ New analysis" />
      <section className={styles.resultHead}>
        <div className={styles.resultMeta}><p className="kicker">INVESTIGATION COMPLETE <span>• JUST NOW</span></p><span className={styles.reportId}>REPORT / {id.slice(-8).toUpperCase()}</span></div>
        <div className={styles.scoreLayout}><div className={styles.scoreRing} style={{ "--score": `${analysis.riskScore * 3.6}deg` } as React.CSSProperties}><div><strong>{analysis.riskScore}</strong><span>/ 100</span></div></div><div className={styles.resultCopy}><p className={`${styles.verdict} ${styles[analysis.verdict.toLowerCase()]}`}>{analysis.verdict}</p><p className={styles.confidence}><span>CONFIDENCE</span>{Math.round(analysis.confidence * 100)}%</p><p className={styles.subject}>{email.subject || "Untitled message"}</p><p className="mono">FROM {email.sender.email}</p></div></div>
        {analysis.assessmentNote && <p className={styles.assessmentNote}>{analysis.assessmentNote}</p>}
        <div className={styles.copilotActions} aria-label="Investigation Copilot actions">
          <a href={copilotHref("Explain this verdict")}>Explain this verdict</a>
          {email.urls[0] && <a href={copilotHref(`Investigate this URL: ${email.urls[0]}`)}>Investigate this URL</a>}
          <a href={copilotHref("Find similar senders")}>Find similar senders</a>
          <a href={copilotHref("Compare with previous emails")}>Compare with previous emails</a>
          <a href={copilotHref("Summarize this report")}>Summarize this report</a>
        </div>
      </section>
      <EvidenceGraph sender={email.sender.email} entities={entities} relayPath={relayPath} />
      <nav className={styles.reportNav} aria-label="Report sections"><button className={openSection === "findings" ? styles.active : ""} onClick={() => openReportSection("findings")}>Findings</button><button className={openSection === "score" ? styles.active : ""} onClick={() => openReportSection("score")}>Score logic</button><button className={openSection === "authentication" ? styles.active : ""} onClick={() => openReportSection("authentication")}>Authentication</button><button className={openSection === "route" ? styles.active : ""} onClick={() => openReportSection("route")}>Mail route</button><button className={openSection === "infrastructure" ? styles.active : ""} onClick={() => openReportSection("infrastructure")}>Infrastructure</button><button className={openSection === "urls" ? styles.active : ""} onClick={() => openReportSection("urls")}>URLs</button></nav>
      <section className={styles.reportWorkspace}>
        <div className={styles.workspaceScroll}>
          {openSection === "findings" && <div className={styles.workspaceView}><section className={styles.workspaceCard} id="findings"><h2>Primary findings</h2>
            {analysis.findings.length ? analysis.findings.map((item) => (
              <article className={styles.finding} key={item.id}>
                <div><span className={`${styles.severity} ${styles[item.severity.toLowerCase()]}`}>{item.severity}</span><h3>{item.title}</h3><p>{item.description}</p></div>
                <div className={styles.evidence}>{item.evidence.map((evidence) => <p key={`${evidence.field}-${evidence.value}`}><span>{evidence.field}</span><code>{evidence.value}</code></p>)}<a className={styles.findingCopilot} href={copilotHref(`Explain the finding: ${item.title}`)}>Ask Copilot about this finding</a></div>
              </article>
            )) : <p className="muted">No suspicious indicators were detected by the current rules.</p>}
          </section></div>}
          {openSection === "score" && <div className={styles.workspaceView}><section className={styles.workspaceCard}><h2>Why this score?</h2>
            {scoreExplanation.length ? scoreExplanation.map((item) => <p className={styles.scoreLine} key={`${item.label}-${item.evidence ?? ""}`}><span>{item.status === "POSITIVE" ? "✓" : item.contribution ? "•" : "○"} {item.label}</span><strong>{item.contribution > 0 ? `+${item.contribution}` : item.contribution}</strong></p>) : <p className="muted">Score explanation is unavailable for this older analysis.</p>}
            <section className={styles.workspaceSubsection}><h2>ML-assisted calibration</h2>{ml?.available ? <><p className={styles.scoreLine}><span>Deterministic score</span><strong>{ml.deterministicRiskScore ?? "-"}</strong></p><p className={styles.scoreLine}><span>ML score ({ml.modelVersion})</span><strong>{ml.mlRiskScore ?? "-"}</strong></p><p className={styles.scoreLine}><span>ML confidence</span><strong>{ml.mlConfidence !== undefined ? `${Math.round(ml.mlConfidence * 100)}%` : "-"}</strong></p><p className={styles.scoreLine}><span>Uncertainty</span><strong>{ml.uncertainty !== undefined ? `${Math.round(ml.uncertainty * 100)}%` : "-"}</strong></p><p className={styles.scoreLine}><span>Effective weight</span><strong>{ml.effectiveWeight !== undefined ? `${Math.round(ml.effectiveWeight * 100)}%` : "-"}</strong></p>{ml.topContributors?.length ? <><strong className={styles.mlSubtitle}>Top contributors</strong>{ml.topContributors.map((item) => <p className={styles.mlLine} key={`${item.feature}-${item.evidence ?? ""}`}><span>{item.feature.replaceAll("_", " ")}</span><strong>{item.direction === "UP" ? "+" : "-"}{item.impact.toFixed(1)}{item.evidence ? ` · ${item.evidence}` : ""}</strong></p>)}</> : null}</> : <p className="muted">ML inference is unavailable for this analysis{ml?.reason ? ` (${ml.reason})` : ""}.</p>}</section>
            <section className={styles.workspaceSubsection}><h2>Analyst verdict</h2>{analysis.analystVerdict ? <><h3>{analysis.analystVerdict.headline}</h3><p>{analysis.analystVerdict.assessment}</p><strong>Supporting evidence</strong>{analysis.analystVerdict.supportingEvidence.map((item) => <p key={item}>✓ {item}</p>)}{analysis.analystVerdict.observations.length > 0 && <><strong>Minor observations</strong>{analysis.analystVerdict.observations.map((item) => <p key={item}>• {item}</p>)}</>}<strong>Recommended action</strong><p>{analysis.analystVerdict.recommendedAction}</p></> : <p className="muted">No analyst assessment is available.</p>}</section>
            {classification && <section className={styles.workspaceSubsection}><h2>Threat classification</h2>{Object.entries(classification).map(([key, value]) => <p className={styles.classificationLine} key={key}><span>{key.replaceAll(/([A-Z])/g, " $1")}</span><strong>{Math.round(value * 100)}%</strong></p>)}<p className={styles.classificationNote}>Deterministic signals for triage, not scientifically validated probabilities.</p></section>}
            {entities && <section className={styles.workspaceSubsection}><h2>Extracted entities</h2>{(["emails", "domains", "ips", "urls", "attachments"] as const).map((key) => <div className={styles.entityLine} key={key}><span>{key}</span><strong>{entities[key].length}</strong><details><summary>View values</summary>{entities[key].map((value) => <code key={value}>{value}</code>)}</details></div>)}</section>}
          </section></div>}
          {openSection === "authentication" && <div className={styles.workspaceView}><section className={styles.workspaceCard}><h2>Authentication</h2>{Object.entries(authentication).map(([key, value]) => <p className={styles.auth} key={key}><span>{key.toUpperCase()}</span><strong>{value ?? "NOT FOUND"}</strong></p>)}</section></div>}
          {openSection === "route" && <div className={styles.workspaceView}><section className={styles.workspaceCard}><h2>Mail route intelligence</h2>{analysis.probableOriginIp ? <p className={styles.origin}><strong>{analysis.probableOriginIp}</strong><span>{email.sender.email.endsWith("@gmail.com") ? "Gmail relay infrastructure observed" : "Earliest public relay IP observed"}</span></p> : <p className="muted">No public origin IP could be established.</p>}<RouteMap points={mapPoints} />{relayPath.map((hop) => <div className={styles.relayHop} key={hop.hop}><span>HOP {hop.hop}</span><code>{hop.ipAddresses.join(", ") || "No IP address"}</code></div>)}<p className={styles.routeNote}>Relay data shows infrastructure reported by message headers. It does not prove a sender&apos;s physical location or identity.</p></section></div>}
          {openSection === "infrastructure" && <div className={styles.workspaceView}><section className={styles.workspaceCard}><h2>Infrastructure enrichment</h2>{enrichment ? <><p className={styles.enrichmentNote}>Best-effort public lookups. Results are contextual evidence, not attribution.</p>{enrichment.providers && <div className={styles.providerStatus}>{([['VirusTotal', enrichment.providers.virusTotal], ['URLScan', enrichment.providers.urlScan]] as const).map(([name, provider]) => provider && <div className={styles.providerStatusCard} key={name}><strong>{name}</strong><span>{provider.configured ? `${provider.succeeded} result${provider.succeeded === 1 ? '' : 's'} from ${provider.checked} URL${provider.checked === 1 ? '' : 's'}` : 'API key not configured'}</span>{provider.message && <span>{provider.message}</span>}</div>)}</div>}{enrichment.ips.map((item) => <div className={styles.enrichmentBlock} key={item.ip}><strong>{item.ip}</strong><span>{[item.city, item.region, item.country].filter(Boolean).join(", ") || "Approximate network location unavailable"}</span><span>{item.isp || item.organization || "Network unavailable"}{item.asn ? ` · ${item.asn}` : ""}</span></div>)}{enrichment.domains.map((item) => <div className={styles.enrichmentBlock} key={item.domain}><strong>{item.domain}</strong><span>DNS: {item.dns.addresses.join(", ") || "No A record"}</span><span>MX: {item.dns.mx.join(", ") || "No MX record"}</span><span>Registrar: {item.rdap?.registrar || "Unavailable"}</span></div>)}{enrichment.urls.map((item) => <div className={styles.enrichmentBlock} key={`${item.source}-${item.url}`}><strong>{item.source}</strong><span>{item.verdict || `Malicious: ${item.malicious ?? 0} · Suspicious: ${item.suspicious ?? 0}`}</span><a className={styles.providerLink} href={item.permalink} target="_blank" rel="noreferrer">View provider report</a></div>)}</> : <p className="muted">Enrichment was not available for this analysis.</p>}</section></div>}
          {openSection === "urls" && <div className={styles.workspaceView}><section className={styles.workspaceCard}><h2>URL intelligence</h2>{urlGroups.map((item) => <div className={styles.urlItem} key={`${item.category}-${item.domain}`}><span>{item.category.replaceAll("_", " ")} · {item.domain} · {item.urls.length} link{item.urls.length === 1 ? "" : "s"}</span><code>{item.category === "DIRECT" ? `${item.domain} (destination link)` : item.decodedTarget?.startsWith("http") ? item.decodedTarget : "Destination unavailable (encoded or obfuscated payload)"}</code><details><summary>View raw URL{item.urls.length === 1 ? "" : "s"}</summary>{item.urls.map((url) => <code key={url}>{url}</code>)}</details></div>)}<h2>Attachments</h2>{email.attachments.map((attachment) => <p className={styles.attachment} key={attachment.sha256}>{attachment.filename}<br /><code>{attachment.sha256}</code></p>)}</section></div>}
        </div>
      </section>
    </main>
  );
}
