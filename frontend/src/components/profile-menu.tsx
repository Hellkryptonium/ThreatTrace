"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, type CurrentUser } from "@/lib/api/auth";
import styles from "./profile-menu.module.css";

interface ProfileMenuProps { user?: CurrentUser; }

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = (user?.name ?? user?.email ?? "?").split(/[ @]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); router.push("/login"); }
    catch { setLoggingOut(false); }
  }

  return <div className={styles.profile} ref={menuRef}>
    <button className={styles.profileTrigger} aria-expanded={open} aria-label="Open profile menu" onClick={() => setOpen((isOpen) => !isOpen)}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{initials}</span>}
      <span className={styles.profileCopy}><strong>{user?.name ?? "Account"}</strong><small>{user?.email ?? ""}</small></span>
      <span className={styles.chevron}>⌄</span>
    </button>
    {open && <div className={styles.profileMenu} role="menu">
      <div className={styles.profileMenuHeading}><span className={styles.statusDot} /> Signed in</div>
      <div className={styles.profileMenuEmail}>{user?.email}</div>
      <button className={styles.logoutButton} role="menuitem" onClick={() => void handleLogout()} disabled={loggingOut}>{loggingOut ? "Signing out..." : "Sign out"}<span>↗</span></button>
    </div>}
  </div>;
}