import { env } from "../../config/env.js";
import type { AnalysisResult, MlAssistance, NormalizedEmail, ThreatVerdict } from "../../types/email.js";

interface MlInferenceResponse {
  riskScore: number;
  confidence: number;
  uncertainty: number;
  modelVersion: string;
  topContributors: { feature: string; impact: number; direction: "UP" | "DOWN"; evidence?: string }[];
}

function scoreToVerdict(score: number, forwarded: boolean): ThreatVerdict {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  if (score > 0) return "LOW";
  return forwarded ? "INCONCLUSIVE" : "SAFE";
}

export async function inferMlAssistance(email: NormalizedEmail, analysis: AnalysisResult): Promise<MlAssistance> {
  const start = Date.now();
  try {
    const payload = {
      subject: email.subject,
      sender: email.sender.email,
      replyTo: email.replyTo,
      returnPath: email.returnPath,
      urls: email.urls,
      attachments: email.attachments.map((attachment) => ({ filename: attachment.filename, sha256: attachment.sha256 })),
      authentication: analysis.authentication,
      findings: analysis.findings.map((item) => ({ type: item.type, severity: item.severity, scoreContribution: item.scoreContribution })),
      relayPath: analysis.relayPath,
      probableOriginIp: analysis.probableOriginIp,
      deterministic: { riskScore: analysis.riskScore, confidence: analysis.confidence, verdict: analysis.verdict },
    };

    const response = await fetch(`${env.ML_SERVICE_URL}/infer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.ML_SERVICE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`ML service returned ${response.status}`);
    const result = await response.json() as MlInferenceResponse;
    const uncertainty = Math.max(0, Math.min(1, result.uncertainty));
    const baseWeight = 0.35;
    const effectiveWeight = uncertainty > 0.4 ? 0.15 : baseWeight;
    const fusedScore = Math.round((analysis.riskScore * (1 - effectiveWeight)) + (result.riskScore * effectiveWeight));
    const fusedConfidence = Math.max(0.4, Math.min(0.98, (analysis.confidence * (1 - effectiveWeight)) + (result.confidence * effectiveWeight)));

    analysis.mlAssistance = {
      available: true,
      modelVersion: result.modelVersion,
      mlRiskScore: result.riskScore,
      mlConfidence: result.confidence,
      uncertainty,
      effectiveWeight,
      deterministicRiskScore: analysis.riskScore,
      deterministicConfidence: analysis.confidence,
      topContributors: result.topContributors,
      latencyMs: Date.now() - start,
    };
    analysis.riskScore = fusedScore;
    analysis.confidence = Number(fusedConfidence.toFixed(2));
    analysis.verdict = scoreToVerdict(fusedScore, Boolean(email.forwarded));
    analysis.scoreExplanation.push({
      label: `ML-assisted calibration (${result.modelVersion})`,
      contribution: fusedScore - (analysis.mlAssistance.deterministicRiskScore ?? fusedScore),
      status: uncertainty > 0.4 ? "NEUTRAL" : "NEGATIVE",
      evidence: `ML ${result.riskScore} @ ${(effectiveWeight * 100).toFixed(0)}% weight`,
    });
    return analysis.mlAssistance;
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "ML inference unavailable",
      deterministicRiskScore: analysis.riskScore,
      deterministicConfidence: analysis.confidence,
      latencyMs: Date.now() - start,
    };
  }
}