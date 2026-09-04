# ThreatTrace ML Service

FastAPI inference service used by the backend for AI-assisted risk calibration.

## Run locally

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

Health check:

```bash
curl http://127.0.0.1:8001/health
```

Inference:

```bash
curl -X POST http://127.0.0.1:8001/infer \
  -H 'content-type: application/json' \
  -d '{"subject":"Verify account","sender":"alerts@trusted.example","urls":["http://192.0.2.10/x"],"authentication":{"spf":"FAIL","dkim":"FAIL","dmarc":"FAIL"},"findings":[],"relayPath":[],"deterministic":{"riskScore":60,"confidence":0.9,"verdict":"HIGH"}}'
```

This service is intentionally evidence-bound: it only scores provided indicators and does not invent new evidence.
