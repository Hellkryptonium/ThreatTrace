import { Suspense } from "react";
import CopilotClient from "./copilot-client";
import styles from "./copilot.module.css";

function CopilotLoading() {
  return <main className={`${styles.shell} shell`}><p className={styles.loading}>LOADING SECURITY COPILOT...</p></main>;
}

export default function CopilotPage() {
  return <Suspense fallback={<CopilotLoading />}><CopilotClient /></Suspense>;
}
