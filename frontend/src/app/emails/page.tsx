"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGmailStatus, listGmailMessages, analyzeGmailMessage, gmailConnectUrl, type GmailMessage, type GmailStatus } from "@/lib/api/gmail";
import { getOutlookStatus, listOutlookMessages, analyzeOutlookMessage, outlookConnectUrl, type OutlookMessage, type OutlookStatus } from "@/lib/api/outlook";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { AppHeader } from "@/components/app-header";
import styles from "./emails.module.css";

export default function EmailsPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<"GMAIL" | "OUTLOOK">("GMAIL");
  const [user, setUser] = useState<CurrentUser>();
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>();
  const [outlookStatus, setOutlookStatus] = useState<OutlookStatus>();
  const [messages, setMessages] = useState<(GmailMessage | OutlookMessage)[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    const outlook = provider === "OUTLOOK";
    const getStatus = outlook ? getOutlookStatus : getGmailStatus;
    const listMessages = outlook ? listOutlookMessages : listGmailMessages;
    getStatus().then((currentStatus) => {
      if (outlook) setOutlookStatus(currentStatus);
      else setGmailStatus(currentStatus);
      if (currentStatus.connected) return listMessages().then(setMessages);
    }).catch((reason: unknown) => { if (reason instanceof Error && reason.message.includes("Authentication required")) router.replace("/login"); else setError(reason instanceof Error ? reason.message : `${provider} mail could not be loaded.`); }).finally(() => setLoading(false));
  }, [provider, router]);

  function switchProvider(nextProvider: "GMAIL" | "OUTLOOK") {
    if (nextProvider === provider) return;
    setLoading(true);
    setError("");
    setMessages([]);
    setProvider(nextProvider);
  }

  async function analyze(message: GmailMessage | OutlookMessage) {
    if (!message.id) return;
    setBusyId(message.id); setError("");
    try { const result = provider === "OUTLOOK" ? await analyzeOutlookMessage(message.id) : await analyzeGmailMessage(message.id); router.push(`/investigations/${result.id}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Analysis failed."); setBusyId(""); }
  }

  const status = provider === "OUTLOOK" ? outlookStatus : gmailStatus;
  const providerName = provider === "OUTLOOK" ? "Outlook" : "Gmail";
  const connectUrl = provider === "OUTLOOK" ? outlookConnectUrl() : gmailConnectUrl();
  return <main className={`${styles.shell} shell inbox`}><AppHeader user={user} actionHref="/analyze/upload" actionLabel="+ New analysis" /><section className={styles.inboxHeading}><div><p className="kicker">{providerName.toUpperCase()} MAILBOX</p><h1>Choose a message<br /><em>to investigate.</em></h1><div className={styles.providerSwitch} role="tablist" aria-label="Mail provider"><button className={`${styles.providerOption} ${provider === "GMAIL" ? styles.providerOptionActive : ""}`} role="tab" aria-selected={provider === "GMAIL"} onClick={() => switchProvider("GMAIL")}>Gmail</button><button className={`${styles.providerOption} ${provider === "OUTLOOK" ? styles.providerOptionActive : ""}`} role="tab" aria-selected={provider === "OUTLOOK"} onClick={() => switchProvider("OUTLOOK")}>Outlook</button></div></div>{status?.connected ? <span className={styles.connected}>Connected as {status.email}</span> : <a className={styles.connectButton} href={connectUrl}>Connect {providerName}</a>}</section>{error && <p className={styles.error} role="alert">{error} {error.includes(`${providerName} authorization expired`) && <a className={styles.connectButton} href={connectUrl}>Reconnect {providerName}</a>}</p>}{loading ? <p className="muted">Loading your mailbox...</p> : error ? null : !status?.connected ? <section className={styles.empty}><h2>{providerName} is not connected</h2><p>Connect a read-only {providerName} account to select messages for analysis.</p></section> : !messages.length ? <section className={styles.empty}><h2>No messages found</h2><p>Your mailbox returned no messages available for investigation.</p></section> : <section className={styles.messageList}>{messages.map((message) => <article className={styles.messageRow} key={message.id}><div className={styles.messageMain}><strong>{message.from ?? "Unknown sender"}</strong><h2>{message.subject}</h2><p>{message.snippet}</p></div><time>{message.date ? new Date(message.date).toLocaleDateString() : ""}</time><button className={styles.analyzeButton} onClick={() => void analyze(message)} disabled={busyId === message.id}>{busyId === message.id ? "Analyzing..." : "Analyze"}</button></article>)}</section>}<footer><a href="/analyze/upload">Upload .eml</a><span>{providerName.toUpperCase()} READ-ONLY / v1</span></footer></main>;
}
