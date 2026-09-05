"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, updateOnboarding, type CurrentUser, type OnboardingState } from "@/lib/api/auth";
import { getGmailStatus, gmailConnectUrl, type GmailStatus } from "@/lib/api/gmail";
import { getOutlookStatus, outlookConnectUrl, type OutlookStatus } from "@/lib/api/outlook";
import { listSavedEmails, type SavedEmail } from "@/lib/api/saved-emails";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [onboarding, setOnboarding] = useState<OnboardingState>();
  const [gmail, setGmail] = useState<GmailStatus>();
  const [outlook, setOutlook] = useState<OutlookStatus>();
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getCurrentUser(), getGmailStatus(), getOutlookStatus(), listSavedEmails()])
      .then(([currentUser, gmailStatus, outlookStatus, savedEmails]) => {
        setUser(currentUser);
        setOnboarding(currentUser.onboarding);
        setGmail(gmailStatus);
        setOutlook(outlookStatus);
        setEmails(savedEmails);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const mailboxConnected = Boolean(gmail?.connected || outlook?.connected);
  const hasInvestigation = emails.length > 0;
  const intakeChosen = Boolean(onboarding?.intake);

  async function saveChoice(intake: "gmail" | "outlook" | "upload") {
    setBusy(true);
    setError("");
    try {
      const updated = await updateOnboarding({ intake, status: "in_progress" });
      setOnboarding(updated);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your setup choice.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function connect(intake: "gmail" | "outlook") {
    if (await saveChoice(intake)) window.location.assign(intake === "gmail" ? gmailConnectUrl() : outlookConnectUrl());
  }

  async function upload() {
    if (await saveChoice("upload")) router.push("/analyze/upload");
  }

  async function finish(status: "dismissed" | "completed") {
    setBusy(true);
    setError("");
    try {
      await updateOnboarding({ status });
      router.push("/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update setup status.");
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.brand}><span>T</span><strong>THREATTRACE</strong></Link>
        <button className={styles.skip} type="button" onClick={() => void finish("dismissed")} disabled={busy}>Skip for now</button>
      </header>
      <section className={styles.shell} aria-labelledby="onboarding-title">
        <div className={styles.intro}>
          <p className="kicker">WELCOME{user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}</p>
          <h1 id="onboarding-title">Start with the message.<br /><em>Follow the evidence.</em></h1>
          <p>ThreatTrace turns suspicious email into a reviewable evidence trail. Choose the fastest way to begin; every option remains available later.</p>
        </div>
        <div className={styles.progress} aria-label="Onboarding progress"><span className={intakeChosen ? styles.done : styles.active}>1. Choose</span><span className={mailboxConnected || hasInvestigation ? styles.done : ""}>2. Import</span><span className={hasInvestigation ? styles.done : ""}>3. Review</span></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {hasInvestigation ? (
          <section className={styles.complete}>
            <span className={styles.check}>✓</span>
            <div><p className="kicker">FIRST STEP COMPLETE</p><h2>Your workspace is ready for investigation.</h2><p>{hasInvestigation ? "Your first message is in the workspace. Continue to review its evidence and findings." : "Your mailbox is connected. Choose a message from your inbox when you are ready."}</p></div>
            <button type="button" onClick={() => void finish("completed")} disabled={busy}>Open workspace</button>
          </section>
        ) : mailboxConnected ? (
          <section className={styles.complete}>
            <span className={styles.check}>2</span>
            <div><p className="kicker">MAILBOX CONNECTED</p><h2>Choose the first message to investigate.</h2><p>Your inbox is ready. Select a message from it to build the first evidence trail and finish setup.</p></div>
            <Link className={styles.inboxAction} href="/emails">Open inbox</Link>
          </section>
        ) : (
          <section className={styles.choices} aria-label="Choose an intake method">
            <article className={`${styles.choice} ${onboarding?.intake === "upload" ? styles.selected : ""}`}><span className={styles.icon}>↥</span><p className="kicker">FASTEST START</p><h2>Upload an .eml file</h2><p>Analyze a saved raw email with headers, links, attachments, and route data intact.</p><button type="button" onClick={() => void upload()} disabled={busy}>Upload an email <span>→</span></button></article>
            <article className={`${styles.choice} ${onboarding?.intake === "gmail" ? styles.selected : ""}`}><span className={styles.icon}>G</span><p className="kicker">READ-ONLY ACCESS</p><h2>Connect Gmail</h2><p>Browse recent Gmail messages and choose exactly which ones to investigate.</p><button type="button" onClick={() => void connect("gmail")} disabled={busy}>Connect Gmail <span>→</span></button></article>
            <article className={`${styles.choice} ${onboarding?.intake === "outlook" ? styles.selected : ""}`}><span className={styles.icon}>O</span><p className="kicker">READ-ONLY ACCESS</p><h2>Connect Outlook</h2><p>Bring Microsoft 365 messages into the same evidence-first workflow.</p><button type="button" onClick={() => void connect("outlook")} disabled={busy}>Connect Outlook <span>→</span></button></article>
          </section>
        )}
        <aside className={styles.note}><strong>Your control, throughout.</strong><span>Mailbox access is read-only. ThreatTrace only analyzes messages you explicitly select.</span></aside>
      </section>
    </main>
  );
}
