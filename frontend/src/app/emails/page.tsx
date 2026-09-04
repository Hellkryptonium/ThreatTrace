"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGmailStatus, listGmailMessages, analyzeGmailMessage, gmailConnectUrl, type GmailMessage, type GmailStatus } from "@/lib/api/gmail";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { AppHeader } from "@/components/app-header";
import styles from "./emails.module.css";

export default function EmailsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [status, setStatus] = useState<GmailStatus>();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getCurrentUser(), getGmailStatus()]).then(([currentUser, gmailStatus]) => {
      setUser(currentUser);
      setStatus(gmailStatus);
      if (gmailStatus.connected) return listGmailMessages().then(setMessages);
    }).catch((reason: unknown) => { if (reason instanceof Error && reason.message.includes("Authentication required")) router.replace("/login"); else setError(reason instanceof Error ? reason.message : "Gmail could not be loaded."); }).finally(() => setLoading(false));
  }, [router]);

  async function analyze(message: GmailMessage) {
    if (!message.id) return;
    setBusyId(message.id); setError("");
    try { const result = await analyzeGmailMessage(message.id); router.push(`/investigations/${result.id}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Analysis failed."); setBusyId(""); }
  }

  return <main className={`${styles.shell} shell inbox`}><AppHeader user={user} actionHref="/analyze/upload" actionLabel="+ New analysis" /><section className={styles.inboxHeading}><div><p className="kicker">GMAIL MAILBOX</p><h1>Choose a message<br /><em>to investigate.</em></h1></div>{status?.connected ? <span className={styles.connected}>Connected as {status.email}</span> : <a className={styles.connectButton} href={gmailConnectUrl()}>Connect Gmail</a>}</section>{error && <p className={styles.error} role="alert">{error} {error.includes("Gmail authorization expired") && <a className={styles.connectButton} href={gmailConnectUrl()}>Reconnect Gmail</a>}</p>}{loading ? <p className="muted">Loading your mailbox...</p> : error ? null : !status?.connected ? <section className={styles.empty}><h2>Gmail is not connected</h2><p>Connect a read-only Gmail account to select messages for analysis.</p></section> : !messages.length ? <section className={styles.empty}><h2>No messages found</h2><p>Your mailbox returned no messages available for investigation.</p></section> : <section className={styles.messageList}>{messages.map((message) => <article className={styles.messageRow} key={message.id}><div className={styles.messageMain}><strong>{message.from ?? "Unknown sender"}</strong><h2>{message.subject}</h2><p>{message.snippet}</p></div><time>{message.date ? new Date(message.date).toLocaleDateString() : ""}</time><button className={styles.analyzeButton} onClick={() => void analyze(message)} disabled={busyId === message.id}>{busyId === message.id ? "Analyzing..." : "Analyze"}</button></article>)}</section>}<footer><a href="/analyze/upload">Upload .eml</a><span>GMAIL READ-ONLY / v1</span></footer></main>;
}
