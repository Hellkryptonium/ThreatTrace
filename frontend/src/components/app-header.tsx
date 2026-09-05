import { ProfileMenu } from "./profile-menu";
import type { CurrentUser } from "@/lib/api/auth";
import styles from "./app-header.module.css";
import Link from "next/link";

interface AppHeaderProps {
  user?: CurrentUser;
  actionHref: string;
  actionLabel: string;
}

export function AppHeader({ user, actionHref, actionLabel }: AppHeaderProps) {
  return (
    <header className={styles.topbar}>
      <a className={styles.brandLockup} href="/analyze/upload">
        <span className={styles.brandMark}>T</span>
        <span>
          <strong>THREATTRACE</strong>
          <small>EVIDENCE-FIRST SECURITY</small>
        </span>
      </a>
      <nav className={styles.primaryNav} aria-label="Workspace navigation">
        <Link href="/dashboard">Overview</Link>
        <Link href="/emails">Inbox</Link>
        <Link href="/saved-emails">Saved emails</Link>
        <Link href="/investigations">Investigations</Link>
        <Link href="/copilot">Copilot</Link>
        <Link href="/connections">Connections</Link>
      </nav>
      <span className={styles.topActions}>
        <a className={styles.newAnalysis} href={actionHref}>
          {actionLabel}
        </a>
        <ProfileMenu user={user} />
      </span>
    </header>
  );
}
