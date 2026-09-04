import { googleLoginUrl } from "@/lib/api/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  return <main className={styles.authPage}><section className={styles.authPanel}><p className={styles.brand}>THREATTRACE</p><h1>Investigate with clarity.</h1><p>Secure access to evidence-first email investigations.</p><a className={styles.googleButton} href={googleLoginUrl()}><span>G</span> Continue with Google</a><small>Google authentication is handled securely by the ThreatTrace API.</small></section></main>;
}