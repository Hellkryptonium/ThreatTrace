import { googleLoginUrl } from "@/lib/api/auth";

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-panel"><p className="brand">THREATTRACE</p><h1>Investigate with clarity.</h1><p>Secure access to evidence-first email investigations.</p><a className="google-button" href={googleLoginUrl()}><span>G</span> Continue with Google</a><small>Google authentication is handled securely by the ThreatTrace API.</small></section></main>;
}