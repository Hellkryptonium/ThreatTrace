"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { deleteSavedEmail, getSavedEmailRaw, listSavedEmails, type SavedEmail } from "@/lib/api/saved-emails";
import styles from "./saved-emails.module.css";

export default function SavedEmailsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => router.replace("/login"));
    listSavedEmails().then(setEmails).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load saved emails.")).finally(() => setLoading(false));
  }, [router]);

  async function removeEmail(id: string) {
    if (!window.confirm("Delete this saved email and its investigation?")) return;
    try { await deleteSavedEmail(id); setEmails((current) => current.filter((email) => email.id !== id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete saved email."); }
  }

  async function openOriginal(id: string) {
    try {
      const { url } = await getSavedEmailRaw(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to open the original email."); }
  }

  return <main className={`${styles.shell} shell`}><AppHeader user={user} actionHref="/analyze/upload" actionLabel="+ New analysis" /><section className={styles.heading}><div><p className="kicker">SAVED EMAILS</p><h1>Your evidence<br /><em>library.</em></h1></div><p>Keep analyzed messages close to their findings. Original files remain private and are only made available through the API.</p></section>{error && <p className={styles.error} role="alert">{error}</p>}{loading ? <p className="muted">Loading saved emails...</p> : !emails.length ? <section className={styles.empty}><h2>No saved emails yet</h2><p>Upload an .eml file or analyze a mailbox message to build your library.</p></section> : <section className={styles.list}>{emails.map((email) => <article className={styles.row} key={email.id}><div><h2>{email.subject || "Untitled message"}</h2><p className={styles.sender}>{email.sender.name ? `${email.sender.name} · ` : ""}{email.sender.email}</p><p className={styles.meta}><span>{email.source}</span><span>{email.date ? new Date(email.date).toLocaleDateString() : "Date unavailable"}</span><span>{email.hasRawFile ? "Original available" : "No original file"}</span></p></div><div className={styles.score}><span className={`${styles.verdict} ${email.verdict ? styles[email.verdict.toLowerCase()] : ""}`}>{email.verdict ?? "ANALYSIS PENDING"}</span>{email.riskScore ?? "-"}<small>RISK / 100</small></div><div className={styles.actions}>{email.investigationId && <a href={`/investigations/${email.investigationId}`}>Open investigation</a>}{email.hasRawFile && <button onClick={() => void openOriginal(email.id)}>Original</button>}<button className={styles.delete} onClick={() => void removeEmail(email.id)}>Delete</button></div></article>)}</section>}</main>;
}
