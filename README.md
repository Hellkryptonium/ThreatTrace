# ThreatTrace

**Evidence-first email threat detection and forensic intelligence platform.**

ThreatTrace is being built for **SIH Problem Statement 26106 — AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform.**

Instead of simply saying *"this email is phishing"*, ThreatTrace analyzes the available evidence and explains **why** an email is considered suspicious.

---

## How It Works

```text
Gmail / .eml
     ↓
Email Normalization
     ↓
Header & Authentication Analysis
     ↓
URL & Attachment Analysis
     ↓
Mail Route Analysis
     ↓
Infrastructure Enrichment
     ↓
Explainable Risk Score
     ↓
Investigation Report
```

The core principle is:

> **Evidence first. AI second.**

The current detection engine is primarily deterministic. AI/ML will be added as an investigation and detection layer later.

---

## Current Features

### Authentication & Email Ingestion

* Google OAuth login
* Gmail read-only integration
* `.eml` file upload
* MongoDB-backed sessions
* Encrypted Gmail refresh-token storage

### Email Analysis

* SPF / DKIM / DMARC analysis
* Sender, Reply-To and Return-Path analysis
* Forwarded-email detection
* Received-header parsing
* URL extraction
* URL shortener detection
* Tracking-redirect detection
* IP-based URL detection
* Attachment extraction
* SHA-256 attachment hashing

### Threat Intelligence

* DNS / MX records
* RDAP
* IP geolocation
* ASN and organization information
* VirusTotal integration
* URLScan integration

### Investigation

Each investigation provides:

* Risk score
* Verdict
* Confidence
* Evidence-backed findings
* Authentication results
* Mail route
* Infrastructure information
* URL intelligence
* Attachments
* Analyst explanation

Risk levels:

```text
0          SAFE / INCONCLUSIVE
1–29       LOW
30–59      MEDIUM
60–79      HIGH
80–100     CRITICAL
```

A technical anomaly does not automatically mean malicious activity. For example, tracking redirects may be reported as information without contributing risk.

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript
* MongoDB
* Mongoose
* Zod
* Mailparser
* Gmail API
* Google OAuth

### Testing

* Vitest
* Supertest

---

## Project Structure

```text
threattrace/
├── README.md
├── frontend/
│   └── Next.js application
└── backend/
    └── Express API
```

The frontend communicates with the backend through REST APIs. Secrets and third-party credentials remain on the backend.

---

## Run Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend:

```text
http://localhost:4000
```

Frontend:

```text
http://localhost:3000
```

Copy `.env.example` to `.env` and configure MongoDB and Google OAuth credentials.

---

## Roadmap

### Next

* Improve entity extraction and normalization
* Improve mail-route reconstruction
* Strengthen domain and URL analysis
* Improve investigation presentation
* Add lightweight relationship/attack graph

### After Core Detection

* AI Analyst for evidence-based investigation
* NLP / ML phishing and BEC detection
* Campaign correlation
* Investigation timelines
* Incident reports
* Analyst notes and case management

The AI layer will interpret evidence produced by ThreatTrace rather than replacing the underlying detection engine.

---

## SIH 26106 Alignment

| Requirement                | ThreatTrace                          |
| -------------------------- | ------------------------------------ |
| Fraudulent email detection | Risk engine & security analysis      |
| Header analysis            | SPF, DKIM, DMARC, Received, Reply-To |
| Origin analysis            | Mail-route reconstruction            |
| Geolocation                | IP & network intelligence            |
| Identity correlation       | Domains, IPs, URLs & hashes          |
| Investigation dashboard    | Investigation workspace              |
| Forensic intelligence      | Evidence-backed findings             |
| AI assistance              | Planned AI Analyst                   |
| ML detection               | Planned ML layer                     |

---

## Project Goal

ThreatTrace is not intended to be just another phishing classifier.

The goal is to turn:

```text
Email
 ↓
Evidence
 ↓
Indicators
 ↓
Infrastructure
 ↓
Correlation
 ↓
Risk
 ↓
Investigation
```

into a practical security investigation workflow.

**Status:** Prototype / SIH Hackathon Development
