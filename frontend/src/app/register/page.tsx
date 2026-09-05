"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { googleLoginUrl, microsoftLoginUrl, registerAccount } from "@/lib/api/auth";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try { await registerAccount({ name: form.name, email: form.email, username: form.username, password: form.password }); router.replace("/onboarding"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Registration failed."); setBusy(false); }
  }

  return <main className={styles.authPage}><section className={styles.authPanel}>
    <Link href="/" className={styles.brand}>THREATTRACE</Link>
    <h1>Create your account.</h1><p className={styles.lede}>Build one secure workspace for email investigations and connected mailboxes.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>FULL NAME<input required value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" /></label>
      <label className={styles.field}>EMAIL<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></label>
      <label className={styles.field}>USERNAME<input required value={form.username} onChange={(event) => update("username", event.target.value)} autoComplete="username" /></label>
      <label className={styles.field}>PASSWORD<input required minLength={8} type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" /></label>
      <label className={styles.field}>CONFIRM PASSWORD<input required minLength={8} type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" /></label>
      <button className={styles.submit} disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
    </form>
    <div className={styles.divider}>OR</div><a className={styles.googleButton} href={googleLoginUrl()}><span>G</span> Continue with Google</a><a className={styles.microsoftButton} href={microsoftLoginUrl()}><span>M</span> Continue with Microsoft</a>
    <p className={styles.loginLink}>Already have an account? <Link href="/login">Sign in</Link></p>
  </section></main>;
}
