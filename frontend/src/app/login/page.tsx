import { googleLoginUrl } from "@/lib/api/auth";
import styles from "./login.module.css";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className={styles.authPage}>
      <section className={styles.authPanel}>
        <Link href="/" className={styles.brand} style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}>
          ← BACK TO HOME
        </Link>
        <h1>Investigate with clarity.</h1>
        <p>Secure access to evidence-first email investigations.</p>
        <a className={styles.googleButton} href={googleLoginUrl()}>
          <span>G</span> Continue with Google
        </a>
        <small>Google authentication is handled securely by the ThreatTrace API.</small>
      </section>
    </main>
  );
}