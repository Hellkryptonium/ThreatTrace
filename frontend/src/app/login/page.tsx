"use client";

import { FormEvent, useState } from "react";
import { googleLoginUrl, loginAccount, microsoftLoginUrl } from "@/lib/api/auth";
import styles from "./login.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await loginAccount({ identifier, password }); router.replace("/analyze/upload"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Login failed."); setBusy(false); }
  }
  return (
    <main className={styles.authPage}>
      <section className={styles.authPanel}>
        <Link href="/" className={styles.brand} style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}>
          ← BACK TO HOME
        </Link>
        <h1>Investigate with clarity.</h1>
        <p>Secure access to evidence-first email investigations.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>EMAIL OR USERNAME<input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" /></label>
          <label className={styles.field}>PASSWORD<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
          <button className={styles.submit} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        <a className={styles.googleButton} href={googleLoginUrl()}>
          <span>G</span> Continue with Google
        </a>
        <a className={styles.microsoftButton} href={microsoftLoginUrl()}><span>□</span> Continue with Microsoft</a>
        <small>Google authentication is handled securely by the ThreatTrace API.</small>
        <p className={styles.registerLink}>New to ThreatTrace? <Link href="/register">Create an account</Link></p>
      </section>
    </main>
  );
}