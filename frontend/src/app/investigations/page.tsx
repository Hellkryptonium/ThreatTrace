"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { listSavedEmails, type SavedEmail } from "@/lib/api/saved-emails";
import styles from "./investigations.module.css";

export default function InvestigationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getCurrentUser(), listSavedEmails()])
      .then(([currentUser, saved]) => {
        setUser(currentUser);
        setEmails(saved.filter((email) => email.investigationId));
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
              : "Unable to load investigations.",
          );
      });
  }, [router]);
  return (
    <main className={`${styles.shell} shell`}>
      <AppHeader
        user={user}
        actionHref="/analyze/upload"
        actionLabel="+ New analysis"
      />
      <section className={styles.heading}>
        <p className="kicker">INVESTIGATIONS</p>
        <h1>
          Follow the evidence
          <br />
          <em>to a decision.</em>
        </h1>
        <p>
          Every completed analysis, kept with its original message context and
          next action.
        </p>
      </section>
      {error && <p className="error">{error}</p>}
      {!emails.length ? (
        <section className={styles.empty}>
          <h2>No investigations yet</h2>
          <p>Analyze an email to create your first evidence-backed report.</p>
          <Link href="/analyze/upload">Analyze an email</Link>
        </section>
      ) : (
        <section className={styles.list}>
          {emails.map((email) => (
            <Link
              className={styles.row}
              href={`/investigations/${email.investigationId}`}
              key={email.id}
            >
              <div>
                <span>
                  {email.source} ·{" "}
                  {email.date
                    ? new Date(email.date).toLocaleDateString()
                    : "Date unavailable"}
                </span>
                <h2>{email.subject || "Untitled message"}</h2>
                <p>{email.sender.email}</p>
              </div>
              <strong
                className={
                  email.riskScore !== undefined && email.riskScore >= 60
                    ? styles.high
                    : email.riskScore !== undefined && email.riskScore >= 30
                      ? styles.medium
                      : styles.low
                }
              >
                {email.verdict ?? "ANALYZED"}
                <small>
                  {email.riskScore !== undefined
                    ? `${email.riskScore}/100`
                    : ""}
                </small>
              </strong>
              <span className={styles.open}>Open report →</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
