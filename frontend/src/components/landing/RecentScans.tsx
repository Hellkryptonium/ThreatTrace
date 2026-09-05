"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { getCurrentUser } from "@/lib/api/auth";
import { getGmailStatus } from "@/lib/api/gmail";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const SCANS_DATA = [
  {
    id: "scan-1",
    category: "safe",
    verdictLabel: "Safe",
    verdictBadgeClass: "bg-emerald-100 text-emerald-800",
    title: "Google Account Security Alert",
    titleHoverClass: "group-hover:text-primary",
    sender: "From: Google Accounts <no-reply@accounts.google.com>",
    senderClass: "text-on-surface-variant",
    finding: "Verified genuine sender, all links safe",
    findingClass: "text-on-surface-variant",
    time: "Today at 2:22 PM",
    rowBg: "hover:bg-surface-container-low",
    btnClass: "bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface group-hover:shadow-sm",
    btnText: "View",
  },
  {
    id: "scan-2",
    category: "threats",
    verdictLabel: "Scam Alert",
    verdictBadgeClass: "bg-error text-on-error",
    title: "Overdue Payment Invoice #8491",
    titleHoverClass: "group-hover:text-error",
    sender: "From: ACH Dispatch <remittance@global-f1nance.net> (Fake)",
    senderClass: "text-error font-medium",
    finding: "Fake invoice attempting to steal banking details",
    findingClass: "text-error font-medium",
    time: "Today at 12:48 PM",
    rowBg: "bg-error-container/10 hover:bg-error-container/20",
    btnClass: "bg-error text-on-error hover:bg-error/90 shadow-sm",
    btnText: "Review",
  },
  {
    id: "scan-3",
    category: "threats",
    verdictLabel: "Suspicious",
    verdictBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "Review & Sign DocuSign Agreement",
    titleHoverClass: "group-hover:text-tertiary",
    sender: "From: DocuSign Secure <dse@docusıgn-online.com>",
    senderClass: "text-on-surface-variant",
    finding: "Fake document link, does not go to DocuSign",
    findingClass: "text-tertiary font-medium",
    time: "Today at 9:15 AM",
    rowBg: "hover:bg-surface-container-low",
    btnClass: "bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface group-hover:shadow-sm",
    btnText: "View",
  },
  {
    id: "scan-4",
    category: "threats",
    verdictLabel: "Quarantined",
    verdictBadgeClass: "bg-error-container text-on-error-container",
    title: "Password Expiring Today - Keep Access",
    titleHoverClass: "group-hover:text-error",
    sender: "From: MS 365 Admin <notifications@m365-tenant-portal.org>",
    senderClass: "text-on-surface-variant",
    finding: "Urgent trick designed to capture your login credentials",
    findingClass: "text-on-surface-variant",
    time: "Yesterday at 9:03 PM",
    rowBg: "hover:bg-surface-container-low",
    btnClass: "bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface group-hover:shadow-sm",
    btnText: "View",
  },
];

export function RecentScans() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "safe" | "threats">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated or has connected gmail
    Promise.all([getCurrentUser(), getGmailStatus()])
      .then(([user, gmail]) => {
        if (gmail?.connected && gmail?.email) {
          setUserEmail(gmail.email);
        } else if (user?.email) {
          setUserEmail(user.email);
        }
      })
      .catch(() => {
        // Unauthenticated or not connected
        setUserEmail(null);
      });
  }, []);

  const handleRowClick = () => {
    // Route to user's dashboard or login
    getCurrentUser()
      .then(() => router.push("/emails"))
      .catch(() => router.push("/login"));
  };

  const filteredScans = SCANS_DATA.filter((scan) => {
    const matchesFilter = filter === "all" || scan.category === filter;
    const matchesQuery =
      !searchQuery.trim() ||
      scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.finding.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <section className="w-full bg-surface-container-low py-14 lg:py-18" id="recent-scans-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-tertiary">
                Your Inbox Safety Log
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${userEmail ? 'bg-emerald-500' : 'bg-primary'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${userEmail ? 'bg-emerald-600' : 'bg-primary'}`}></span>
                </span>
                <span className="font-label text-[11px] font-medium text-on-surface">
                  {userEmail ? `Connected: ${userEmail}` : "Live Example Stream"}
                </span>
              </div>
            </div>
            <h2 className="font-headline text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight normal-case !mb-0">
              Recent Scanned Emails
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
              A quick look at emails you've checked and their safety verdicts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-label text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                placeholder="Search by sender or email title..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-label cursor-pointer transition-all duration-200 ${
                  filter === "all"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                All (4)
              </button>
              <button
                type="button"
                onClick={() => setFilter("safe")}
                className={`px-3 py-1.5 rounded-lg text-xs font-label cursor-pointer transition-all duration-200 ${
                  filter === "safe"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Safe (1)
              </button>
              <button
                type="button"
                onClick={() => setFilter("threats")}
                className={`px-3 py-1.5 rounded-lg text-xs font-label cursor-pointer transition-all duration-200 ${
                  filter === "threats"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Threats (3)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container/80">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-container font-label text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
            <div className="col-span-2">Verdict</div>
            <div className="col-span-4">Email Title &amp; Sender</div>
            <div className="col-span-3">What We Found</div>
            <div className="col-span-2">Scanned At</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-surface-container/60">
            {filteredScans.length > 0 ? (
              filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={handleRowClick}
                  className={`scan-row p-5 lg:px-6 lg:py-4 transition-all duration-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center group cursor-pointer ${scan.rowBg}`}
                >
                  <div className="lg:col-span-2 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-label font-semibold transition-transform duration-200 group-hover:scale-105 ${scan.verdictBadgeClass}`}
                    >
                      {scan.verdictLabel}
                    </span>
                  </div>
                  <div className="lg:col-span-4 min-w-0">
                    <div
                      className={`font-headline text-sm font-semibold text-on-surface truncate transition-colors ${scan.titleHoverClass}`}
                    >
                      {scan.title}
                    </div>
                    <div className={`font-label text-xs truncate mt-0.5 ${scan.senderClass}`}>
                      {scan.sender}
                    </div>
                  </div>
                  <div className={`lg:col-span-3 text-xs font-body ${scan.findingClass}`}>
                    {scan.finding}
                  </div>
                  <div className="lg:col-span-2 font-label text-xs text-on-surface-variant">
                    {scan.time}
                  </div>
                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick();
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-label font-semibold transition-all duration-200 flex items-center gap-1 cursor-pointer ${scan.btnClass}`}
                    >
                      <span>{scan.btnText}</span>
                      <span className="material-symbols-outlined text-[13px] transition-transform duration-200 group-hover:translate-x-0.5">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="font-body text-xs text-on-surface-variant">
                  No email records matched your filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
