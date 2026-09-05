import Link from "next/link";
import type { OnboardingState } from "@/lib/api/auth";
import styles from "./onboarding-checklist.module.css";

interface OnboardingChecklistProps {
  onboarding?: OnboardingState;
  mailboxConnected: boolean;
  investigationCount: number;
}

export function OnboardingChecklist({ onboarding, mailboxConnected, investigationCount }: OnboardingChecklistProps) {
  const isDismissed = onboarding?.status === "dismissed";
  const isFinished = investigationCount > 0;

  if (isFinished) return null;

  return (
    <section className={styles.card} aria-labelledby="setup-title">
      <div className={styles.heading}>
        <div>
          <p className="kicker">WORKSPACE SETUP</p>
          <h2 id="setup-title">{isDismissed ? "Pick up where you left off." : "Make your first investigation easy."}</h2>
        </div>
        <span className={styles.progress}>1 / 3</span>
      </div>
      <p className={styles.copy}>{mailboxConnected ? "Your mailbox is connected. Choose a message to create the first evidence-backed investigation." : "Choose how you want to bring in a suspicious message. You can connect a read-only inbox or start with a saved .eml file."}</p>
      <div className={styles.steps}>
        <span className={styles.step}><b>1</b> Choose an intake method</span>
        <span className={styles.step}><b>2</b> Bring in a message</span>
        <span className={styles.step}><b>3</b> Review the evidence</span>
      </div>
      <Link className={styles.action} href={mailboxConnected ? "/emails" : "/onboarding"}>{mailboxConnected ? "Open inbox" : isDismissed ? "Resume setup" : "Continue setup"}</Link>
    </section>
  );
}
