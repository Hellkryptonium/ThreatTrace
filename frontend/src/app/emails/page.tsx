"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGmailStatus, listGmailMessages, analyzeGmailMessage, gmailConnectUrl, type GmailMessage, type GmailStatus } from "@/lib/api/gmail";
import { getCurrentUser, logoutUser, type CurrentUser } from "@/lib/api/auth";

export default function EmailsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [status, setStatus] = useState<GmailStatus>();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCurrentUser(), getGmailStatus()]).then(([currentUser, gmailStatus]) => {
      setUser(currentUser);
      setStatus(gmailStatus);
      if (gmailStatus.connected) return listGmailMessages().then(setMessages);
    }).catch((reason: unknown) => { if (reason instanceof Error && reason.message.includes("Authentication")) router.push("/login"); else setError("Gmail could not be loaded."); }).finally(() => setLoading(false));
  }, [router]);

  async function analyze(message: GmailMessage) {
    if (!message.id) return;
    setBusyId(message.id); setError("");
    try { const result = await analyzeGmailMessage(message.id); router.push(`/investigations/${result.id}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Analysis failed."); setBusyId(""); }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return <main className="shell inbox"><header className="topbar"><span className="eyebrow">THREATTRACE <small>/ INBOX</small></span><div className="dropdown-container"><button className="dropdown-toggle" onClick={() => setDropdownOpen(!dropdownOpen)}>{user?.name} ▾</button><div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}><button onClick={handleLogout} className="dropdown-item">Logout</button></div></div></header><section className="inbox-heading"><div><p className="kicker">GMAIL MAILBOX</p><h1>Choose a message<br /><em>to investigate.</em></h1></div>{status?.connected ? <span className="connected">Connected as {status.email}</span> : <a className="connect-button" href={gmailConnectUrl()}>Connect Gmail</a>}</section>{error && <p className="error" role="alert">{error}</p>}{loading ? <p className="muted">Loading your mailbox...</p> : !status?.connected ? <section className="empty"><h2>Gmail is not connected</h2><p>Connect a read-only Gmail account to select messages for analysis.</p></section> : !messages.length ? <section className="empty"><h2>No messages found</h2><p>Your mailbox returned no messages available for investigation.</p></section> : <section className="message-list">{messages.map((message) => <article className="message-row" key={message.id}><div className="message-main"><strong>{message.from ?? "Unknown sender"}</strong><h2>{message.subject}</h2><p>{message.snippet}</p></div><time>{message.date ? new Date(message.date).toLocaleDateString() : ""}</time><button className="analyze-button" onClick={() => void analyze(message)} disabled={busyId === message.id}>{busyId === message.id ? "Analyzing..." : "Analyze"}</button></article>)}</section>}<footer><a href="/analyze/upload">Upload .eml</a><span>GMAIL READ-ONLY / v1</span></footer></main>;
}
