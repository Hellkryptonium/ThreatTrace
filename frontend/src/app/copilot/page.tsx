"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { sendCopilotMessage, type CopilotCitation } from "@/lib/api/copilot";
import styles from "./copilot.module.css";

interface Message { role: "user" | "model"; text: string; citations?: CopilotCitation[]; }
const suggestions = ["Analyze my 10 most recent saved emails", "Find phishing attempts in my saved emails", "Find emails with risky attachments", "Explain my highest-risk email"];

export default function CopilotPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getCurrentUser().then(setUser).catch(() => router.replace("/login")); }, [router]);

  async function submit(event?: FormEvent, suggestion?: string) {
    event?.preventDefault();
    const text = (suggestion ?? input).trim();
    if (!text || busy) return;
    setInput(""); setError(""); setMessages((current) => [...current, { role: "user", text }]); setBusy(true);
    try {
      const result = await sendCopilotMessage(text, conversationId);
      setConversationId(result.conversationId);
      setMessages((current) => [...current, { role: "model", text: result.message, citations: result.citations }]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Copilot is unavailable."); }
    finally { setBusy(false); }
  }

  return <main className={`${styles.shell} shell`}><AppHeader user={user} actionHref="/saved-emails" actionLabel="Saved emails" /><section className={styles.heading}><p className="kicker">SECURITY COPILOT</p><h1>Investigate with<br /><em>evidence.</em></h1><p>Ask ThreatTrace to search your saved email evidence, summarize existing analyses, and connect the findings. Copilot is read-only and cannot change your mailbox.</p></section><section className={styles.workspace}><div className={styles.conversation}><div className={styles.messages}>{!messages.length && <div className={`${styles.message} ${styles.model}`}><p>Tell me what you want to investigate. I will use the evidence already available in your ThreatTrace workspace.</p></div>}{messages.map((message, index) => <article className={`${styles.message} ${styles[message.role]}`} key={`${message.role}-${index}`}><p>{message.text}</p>{message.citations?.length ? <div className={styles.citations}>{message.citations.map((citation, citationIndex) => citation.investigationId ? <a className={styles.citation} href={`/investigations/${citation.investigationId}`} key={`${citation.investigationId}-${citationIndex}`}>{citation.label}</a> : citation.emailId ? <a className={styles.citation} href={`/saved-emails#${citation.emailId}`} key={`${citation.emailId}-${citationIndex}`}>{citation.label}</a> : null)}</div> : null}</article>)}{busy && <p className={styles.loading}>COPILOT IS CHECKING YOUR EVIDENCE...</p>}</div><form className={styles.composer} onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What do you want to investigate?" aria-label="Copilot question" /><button type="submit" disabled={busy || !input.trim()}>Ask</button></form></div><aside className={styles.side}><h2>Start an investigation</h2><p>Use a focused question to keep the result grounded in your saved evidence.</p>{suggestions.map((suggestion) => <button className={styles.suggestion} key={suggestion} onClick={() => void submit(undefined, suggestion)}>{suggestion}</button>)}</aside></section>{error && <p className={styles.error} role="alert">{error}</p>}</main>;
}
