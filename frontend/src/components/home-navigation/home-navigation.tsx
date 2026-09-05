"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { ProfileMenu } from "@/components/profile-menu";
import styles from "./home-navigation.module.css";

export function HomeNavigation() {
  const [user, setUser] = useState<CurrentUser>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => undefined).finally(() => setChecked(true));
  }, []);

  return <nav className={styles.nav} aria-label="Primary navigation">
    <Link href="/" className={styles.brand}><span className={styles.brandMark}>T</span><span className={styles.brandText}><strong>THREATTRACE</strong><small>EVIDENCE-FIRST SECURITY</small></span></Link>
    <div className={styles.navLinks}><Link href="#capabilities">Capabilities</Link><Link href="/safety-guides">Safety guides</Link></div>
    {checked && (user ? <div className={styles.loggedIn}><Link href="/dashboard" className={styles.workspace}>Open workspace</Link><ProfileMenu user={user} /></div> : <div className={styles.navActions}><Link href="/login" className={styles.login}>Sign in</Link><Link href="/register" className={styles.register}>Create account</Link></div>)}
  </nav>;
}
