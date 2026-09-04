import { ProfileMenu } from "./profile-menu";
import type { CurrentUser } from "@/lib/api/auth";
import styles from "./app-header.module.css";

interface AppHeaderProps {
  user?: CurrentUser;
  actionHref: string;
  actionLabel: string;
}

export function AppHeader({ user, actionHref, actionLabel }: AppHeaderProps) {
  return <header className={styles.topbar}>
    <a className={styles.brandLockup} href="/analyze/upload">
      <span className={styles.brandMark}>T</span>
      <span><strong>THREATTRACE</strong><small>EVIDENCE-FIRST SECURITY</small></span>
    </a>
    <span className={styles.topActions}>
      <a className={styles.newAnalysis} href={actionHref}>{actionLabel}</a>
      <ProfileMenu user={user} />
    </span>
  </header>;
}
