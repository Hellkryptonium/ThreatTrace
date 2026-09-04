from __future__ import annotations

from typing import Literal
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="ThreatTrace ML Inference", version="0.1.0")


class FindingSignal(BaseModel):
    type: str
    severity: str
    scoreContribution: int


class RelayHop(BaseModel):
    hop: int
    ipAddresses: list[str] = Field(default_factory=list)


class DeterministicInput(BaseModel):
    riskScore: int
    confidence: float
    verdict: str


class InferenceInput(BaseModel):
    subject: str
    sender: str
    replyTo: str | None = None
    returnPath: str | None = None
    urls: list[str] = Field(default_factory=list)
    attachments: list[dict] = Field(default_factory=list)
    authentication: dict[str, str | None] = Field(default_factory=dict)
    findings: list[FindingSignal] = Field(default_factory=list)
    relayPath: list[RelayHop] = Field(default_factory=list)
    probableOriginIp: str | None = None
    deterministic: DeterministicInput


class Contributor(BaseModel):
    feature: str
    impact: float
    direction: Literal["UP", "DOWN"]
    evidence: str | None = None


class InferenceOutput(BaseModel):
    riskScore: int
    confidence: float
    uncertainty: float
    modelVersion: str
    topContributors: list[Contributor]


def _bounded(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def infer(payload: InferenceInput) -> InferenceOutput:
    contributors: list[Contributor] = []
    score = float(payload.deterministic.riskScore)

    auth_failures = sum(1 for key in ("spf", "dkim", "dmarc") if (payload.authentication.get(key) or "").upper() == "FAIL")
    if auth_failures:
        delta = min(20.0, auth_failures * 6.5)
        score += delta
        contributors.append(Contributor(feature="authentication_failures", impact=delta, direction="UP", evidence=f"{auth_failures} fail"))

    ip_url_count = sum(1 for url in payload.urls if url.startswith("http://") and any(ch.isdigit() for ch in url.split("/")[2]))
    if ip_url_count:
        delta = min(15.0, ip_url_count * 5.0)
        score += delta
        contributors.append(Contributor(feature="ip_based_urls", impact=delta, direction="UP", evidence=f"{ip_url_count} URL(s)"))

    risky_subject_terms = ("urgent", "verify", "password", "wire", "invoice", "account")
    lowered_subject = payload.subject.lower()
    subject_hits = sum(1 for term in risky_subject_terms if term in lowered_subject)
    if subject_hits:
        delta = min(12.0, subject_hits * 2.8)
        score += delta
        contributors.append(Contributor(feature="subject_risk_terms", impact=delta, direction="UP", evidence=f"{subject_hits} term(s)"))

    if payload.replyTo and payload.sender.split("@")[-1] != payload.replyTo.split("@")[-1]:
        delta = 8.0
        score += delta
        contributors.append(Contributor(feature="reply_to_domain_mismatch", impact=delta, direction="UP", evidence=payload.replyTo))

    if payload.deterministic.riskScore == 0 and not auth_failures and not ip_url_count and subject_hits == 0:
        delta = -6.0
        score += delta
        contributors.append(Contributor(feature="benign_signal_cluster", impact=abs(delta), direction="DOWN", evidence="No elevated indicators"))

    model_score = int(round(_bounded(score, 0, 100)))
    signal_count = len(contributors)
    uncertainty = _bounded(0.65 - (signal_count * 0.12), 0.08, 0.62)
    confidence = _bounded(1.0 - (uncertainty * 0.75), 0.45, 0.97)

    return InferenceOutput(
        riskScore=model_score,
        confidence=round(confidence, 2),
        uncertainty=round(uncertainty, 2),
        modelVersion="threattrace-hybrid-v0.1.0",
        topContributors=contributors[:5],
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/infer", response_model=InferenceOutput)
def infer_route(payload: InferenceInput) -> InferenceOutput:
    return infer(payload)
