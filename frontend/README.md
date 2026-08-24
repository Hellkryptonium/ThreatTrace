# ThreatTrace Frontend

Frontend for **ThreatTrace**, an evidence-first email threat detection and forensic intelligence platform built for **SIH Problem Statement 26106**.

The frontend provides the interface for email ingestion, investigation, evidence analysis, and threat intelligence visualization.

> **The frontend displays and interacts with analysis results. It does not calculate threat scores or perform security analysis itself.**

---

## Features

### Authentication

* Google OAuth login
* Protected application routes
* Session-aware UI

### Email Analysis

* `.eml` drag-and-drop upload
* Gmail read-only integration
* Gmail email listing
* Email analysis workflow
* Analysis status and results

### Investigation Workspace

The investigation page currently displays:

* Risk score
* Verdict
* Confidence
* Findings
* SPF / DKIM / DMARC results
* Sender information
* Reply-To / Return-Path
* Mail route
* Relay IP
* DNS / MX information
* RDAP data
* IP geolocation
* ASN information
* URL intelligence
* Attachments
* Extracted entities

Technical details are kept expandable so the main investigation remains easy to scan.

---

## Tech Stack

* **Next.js** — App Router
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Lucide React** for icons
* REST API communication with the ThreatTrace backend

Planned visualization work may use React Flow for relationship graphs.

---

## Pages

```text
/login
/emails
/analyze/upload
/investigations/[id]
```

Planned:

```text
/dashboard
/reports
/settings
```

---

## Project Structure

```text
frontend/
├── app/
│   ├── login/
│   ├── emails/
│   ├── analyze/
│   │   └── upload/
│   └── investigations/
│       └── [id]/
│
├── components/
│   ├── layout/
│   ├── email/
│   ├── investigation/
│   ├── threat/
│   └── ui/
│
├── lib/
│   └── api/
│
└── public/
```

The frontend uses a centralized API layer rather than making backend requests directly throughout UI components.

---

## Design

ThreatTrace is designed as a **professional security investigation tool**.

The interface aims for:

* clean layouts
* restrained colors
* clear information hierarchy
* technical details when needed
* minimal visual noise
* responsive layouts

It intentionally avoids the typical:

* cyberpunk aesthetic
* neon effects
* excessive gradients
* generic AI-dashboard design

The investigation should answer:

```text
What happened?
      ↓
How risky is it?
      ↓
Why?
      ↓
What evidence supports it?
      ↓
What infrastructure is involved?
```

---

## API

The frontend communicates with the backend through REST APIs.

Backend URL during local development:

```text
http://localhost:4000
```

Configure a different API location with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The frontend never directly accesses:

* MongoDB
* Gmail client secrets
* threat-intelligence providers
* AI API keys

All analysis and external integrations are handled by the backend.

---

## Running Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production validation:

```bash
npm run lint
npm run build
```

Make sure the ThreatTrace backend is running before using Gmail or email analysis features.

---

## Current Status

Implemented:

* Google login
* Gmail connection
* Gmail message listing
* `.eml` upload
* Investigation result UI
* Evidence presentation
* Authentication results
* Infrastructure information
* URL intelligence
* Attachment information
* Risk/verdict presentation

---

## Next

The frontend will continue toward a more complete investigation workspace:

* Improve investigation presentation
* Lightweight relationship / attack graph
* Mail-route visualization
* Investigation timeline
* AI Analyst interface
* Investigation history
* Reports
* Better loading and error states
* Responsive polish

The AI Analyst will be an assistant for interpreting existing investigation evidence, not a replacement for the backend detection engine.

---

## Related Repository

The frontend depends on the **ThreatTrace backend** for authentication, email processing, analysis, risk scoring, and threat intelligence.

```text
ThreatTrace
├── Frontend → this repository
└── Backend  → API and analysis engine
```

**Status:** Prototype / SIH Hackathon Development
