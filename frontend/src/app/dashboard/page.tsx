"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { listSavedEmails, type SavedEmail } from "@/lib/api/saved-emails";
import { getGmailStatus, type GmailStatus } from "@/lib/api/gmail";
import { getOutlookStatus, type OutlookStatus } from "@/lib/api/outlook";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [gmail, setGmail] = useState<GmailStatus>();
  const [outlook, setOutlook] = useState<OutlookStatus>();
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getCurrentUser(),
      listSavedEmails(),
      getGmailStatus(),
      getOutlookStatus(),
    ])
      .then(([currentUser, saved, gmailStatus, outlookStatus]) => {
        setUser(currentUser);
        setEmails(saved);
        setGmail(gmailStatus);
        setOutlook(outlookStatus);
      })
      .catch((reason: unknown) => {
        if (
          reason instanceof Error &&
          reason.message.includes("Authentication")
        )
          router.replace("/login");
        else
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load workspace.",
          );
      });
  }, [router]);

  const highRisk = emails.filter(
    (email) => email.riskScore !== undefined && email.riskScore >= 60,
  );
  const attention = emails.filter(
    (email) => email.riskScore !== undefined && email.riskScore >= 30,
  );
  const connected = [gmail?.connected, outlook?.connected].filter(
    Boolean,
  ).length;
  return (
    <main className={`${styles.shell} shell`}>
      <AppHeader
        user={user}
        actionHref="/analyze/upload"
        actionLabel="+ Analyze email"
      />
      <section className={styles.heading}>
        <div>
          <p className="kicker">WORKSPACE OVERVIEW</p>
          <h1>
            Good to see you,
            <br />
            <em>{user?.name?.split(" ")[0] ?? "analyst"}.</em>
          </h1>
        </div>
        <p>
          One calm place for mailbox signals, saved evidence, and the next
          decision.
        </p>
      </section>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <section className={styles.metrics}>
        <article>
          <span>HIGH RISK</span>
          <strong>{highRisk.length}</strong>
          <small>saved findings</small>
        </article>
        <article>
          <span>NEEDS REVIEW</span>
          <strong>{attention.length}</strong>
          <small>medium and above</small>
        </article>
        <article>
          <span>ANALYZED</span>
          <strong>{emails.length}</strong>
          <small>saved emails</small>
        </article>
        <article>
          <span>SOURCES</span>
          <strong>{connected}/2</strong>
          <small>mailboxes connected</small>
        </article>
      </section>
      <section className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className="kicker">RECENT INVESTIGATIONS</p>
              <h2>Keep the thread moving.</h2>
            </div>
            <Link href="/investigations">View all</Link>
          </div>
          {emails.slice(0, 5).map((email) => (
            <article className={styles.row} key={email.id}>
              <div>
                <strong>{email.subject || "Untitled message"}</strong>
                <span>
                  {email.sender.email} · {email.source}
                </span>
              </div>
              <b
                className={
                  email.riskScore !== undefined && email.riskScore >= 60
                    ? styles.high
                    : email.riskScore !== undefined && email.riskScore >= 30
                      ? styles.medium
                      : styles.low
                }
              >
                {email.verdict ?? "UNANALYZED"}
                <small>
                  {email.riskScore !== undefined
                    ? `${email.riskScore}/100`
                    : ""}
                </small>
              </b>
              {email.investigationId && (
                <Link
                  href={`/investigations/${email.investigationId}`}
                  aria-label={`Open ${email.subject}`}
                >
                  Open
                </Link>
              )}
            </article>
          ))}
          {!emails.length && (
            <div className={styles.empty}>
              <h3>Your workspace is ready.</h3>
              <p>
                Upload an email or connect a mailbox to begin building evidence.
              </p>
              <Link href="/analyze/upload">Analyze an email</Link>
            </div>
          )}
        </section>
        <aside className={styles.side}>
          <section className={styles.panel}>
            <p className="kicker">CONNECTIONS</p>
            <h2>Mail sources</h2>
            <div className={styles.connection}>
              <span
                className={gmail?.connected ? styles.dotOn : styles.dotOff}
              />
              <div>
                <strong>Gmail</strong>
                <small>
                  {gmail?.connected ? gmail.email : "Not connected"}
                </small>
              </div>
            </div>
            <div className={styles.connection}>
              <span
                className={outlook?.connected ? styles.dotOn : styles.dotOff}
              />
              <div>
                <strong>Outlook</strong>
                <small>
                  {outlook?.connected ? outlook.email : "Not connected"}
                </small>
              </div>
            </div>
            <Link className={styles.panelLink} href="/connections">
              Manage connections
            </Link>
          </section>
          <section className={`${styles.panel} ${styles.copilot}`}>
            <p className="kicker">SECURITY COPILOT</p>
            <h2>Ask better questions of your evidence.</h2>
            <p>
              Find phishing attempts, explain a verdict, or compare suspicious
              senders.
            </p>
            <Link className={styles.action} href="/copilot">
              Open Copilot
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
