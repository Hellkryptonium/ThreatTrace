"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "./profile-menu";
import type { CurrentUser } from "@/lib/api/auth";
import styles from "./app-header.module.css";

interface AppHeaderProps {
  user?: CurrentUser;
  actionHref?: string;
  actionLabel?: string;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/emails", label: "Inbox", icon: "mail" },
  { href: "/saved-emails", label: "Saved Emails", icon: "bookmark" },
  { href: "/investigations", label: "Investigations", icon: "travel_explore" },
  { href: "/copilot", label: "Copilot", icon: "smart_toy", badge: "AI" },
  { href: "/connections", label: "Connections", icon: "sync_alt" },
];

export function AppHeader({ user, actionHref = "/analyze/upload", actionLabel = "+ New Scan" }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Brand Lockup */}
        <Link className={styles.brandLockup} href="/dashboard">
          <div className={styles.brandMarkWrap}>
            <span className={styles.brandMark}>T</span>
            <span className={styles.brandPulse} />
          </div>
          <div className={styles.brandText}>
            <strong>THREATTRACE</strong>
            <small>INTELLIGENCE & FORENSICS</small>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.primaryNav} aria-label="Workspace navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className={styles.topActions}>
          <Link className={styles.newAnalysis} href={actionHref}>
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>{actionLabel}</span>
          </Link>
          
          <div className={styles.divider} />
          
          <ProfileMenu user={user} />

          {/* Mobile hamburger button */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          <nav className={styles.mobileNav} aria-label="Mobile workspace navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`}
                >
                  <span className={`material-symbols-outlined ${styles.mobileNavIcon}`}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                </Link>
              );
            })}
            <Link
              href={actionHref}
              onClick={() => setMobileOpen(false)}
              className={styles.mobileAction}
            >
              <span className="material-symbols-outlined">upload_file</span>
              <span>{actionLabel}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
