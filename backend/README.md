# ThreatTrace Backend

Backend API and analysis engine for **ThreatTrace**, an evidence-first email threat detection and forensic intelligence platform built for **SIH Problem Statement 26106**.

The backend is the main security and data layer of the application. It handles authentication, email ingestion, parsing, analysis, risk scoring, persistence, and infrastructure enrichment.

---

## Current Features

### Authentication

* Google OAuth
* HTTP-only sessions
* MongoDB-backed session storage
* Protected API routes

### Email Ingestion

* `.eml` upload
* Gmail read-only integration
* MIME parsing
* Email normalization
* Sender and recipient extraction
* Header extraction
* Attachment metadata and SHA-256 hashing

Both Gmail and `.eml` messages use the same analysis pipeline.

### Email Security Analysis

Current checks include:

* SPF
* DKIM
* DMARC
* Reply-To analysis
* Return-Path analysis
* Forwarded-message detection
* Received-header parsing
* URL extraction
* URL shorteners
* Tracking redirects
* IP-based URLs
* URL intelligence

### Infrastructure Enrichment

The backend can collect:

* DNS records
* MX records
* RDAP information
* IP geolocation
* ASN / organization information
* VirusTotal intelligence
* URLScan intelligence

External providers are optional. Core analysis should continue even when an enrichment provider is unavailable.

### Risk Engine

ThreatTrace produces an explainable `0–100` risk score.

```text
0          SAFE / INCONCLUSIVE
1–29       LOW
30–59      MEDIUM
60–79      HIGH
80–100     CRITICAL
```

Findings contain their evidence and score contribution so the frontend can explain how the result was produced.

---

## Analysis Pipeline

```text
Gmail / .eml
      ↓
Normalization
      ↓
Header Analysis
      ↓
Authentication Analysis
      ↓
URL & Attachment Analysis
      ↓
Mail Route Analysis
      ↓
Infrastructure Enrichment
      ↓
Risk Engine
      ↓
Investigation
```

The analysis engine is intentionally evidence-first.

Authentication failures, tracking URLs, or routing anomalies are treated as **signals**, not automatic proof of malicious activity.

---

## Tech Stack

* Node.js
* TypeScript
* Express
* MongoDB
* Mongoose
* Zod
* Mailparser
* Multer
* Google OAuth
* Gmail API
* Vitest
* Supertest

---

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── tests/
├── .env.example
└── package.json
```

Business logic is kept in services rather than controllers, while database access remains behind the backend layer.

---

## API

All APIs use:

```text
/api/v1/
```

Current areas include:

```text
/api/v1/auth
/api/v1/gmail
/api/v1/outlook
/api/v1/emails
/api/v1/investigations
```

Important endpoints:

```http
GET  /api/v1/auth/me
POST /api/v1/auth/logout

GET  /api/v1/gmail/connect
GET  /api/v1/gmail/status
GET  /api/v1/gmail/messages
POST /api/v1/gmail/messages/:messageId/analyze

GET  /api/v1/outlook/connect
GET  /api/v1/outlook/status
GET  /api/v1/outlook/messages
POST /api/v1/outlook/messages/:messageId/analyze

POST /api/v1/emails/upload

GET  /api/v1/investigations/:id
```

The frontend never calculates threat scores or accesses MongoDB directly.

---

## Environment

Create a `.env` file from `.env.example`.

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000

MONGODB_URI=mongodb://127.0.0.1:27017/threattrace

MAX_UPLOAD_BYTES=10485760

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
GMAIL_CALLBACK_URL=http://localhost:4000/api/v1/gmail/callback

SESSION_SECRET=
GMAIL_TOKEN_ENCRYPTION_KEY=

VIRUSTOTAL_API_KEY=
URLSCAN_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit `.env` or API credentials.

Cloudinary is optional. When configured, profile avatars are stored as images and uploaded `.eml` files are archived as private raw assets. Analysis continues without storage if Cloudinary is unavailable.

Gmail requires the Gmail API to be enabled in Google Cloud with the appropriate OAuth redirect URI configured.

Outlook requires a Microsoft Entra app registration with delegated `User.Read`, `Mail.Read`, `openid`, `profile`, `email`, and `offline_access` permissions. Register the callback URL from `OUTLOOK_CALLBACK_URL` exactly.

---

## Running Locally

```bash
npm install
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

Validation:

```bash
npm test
npm run typecheck
npm run build
```

---

## Security

Email content is treated as untrusted input.

The backend does not:

* execute uploaded attachments
* automatically open suspicious URLs
* store Gmail passwords
* expose OAuth tokens to the frontend
* expose third-party API keys
* treat LLM output as security evidence

HTML email and uploaded content must be handled carefully to avoid introducing security issues into the application.

---

## Roadmap

### Next

* Improve entity normalization
* Improve mail-route reconstruction
* Strengthen domain and URL analysis
* Improve risk calibration
* Improve investigation data

### Planned

* Lightweight relationship / attack graph
* Investigation timeline
* AI Analyst
* ML-based phishing/BEC detection
* Campaign correlation
* Investigation reports
* Analyst notes and case management

The AI layer will interpret evidence produced by the backend rather than replacing the underlying detection engine.

---

## Architecture Direction

The backend is currently a modular Express application.

As the project grows, optional services can be introduced for:

```text
Node.js API
    │
    ├── MongoDB
    ├── Gmail
    ├── Threat Intelligence
    ├── AI Provider
    └── Python ML Service
```

There is no need to introduce separate services until the prototype actually requires them.

---

## Prototype Goal

The backend should support the complete investigation flow:

```text
Email
 ↓
Normalize
 ↓
Analyze
 ↓
Collect evidence
 ↓
Calculate risk
 ↓
Persist investigation
 ↓
Return explainable results
```

The same pipeline should work whether the email comes from Gmail or an `.eml` upload.

**Status:** Prototype / SIH Hackathon Development
