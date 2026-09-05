"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { deleteInvestigations, exportInvestigations, listInvestigations, type InvestigationHistoryItem } from "@/lib/api/saved-emails";
import styles from "./investigations.module.css";

const pageSize = 20;

export default function InvestigationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [items, setItems] = useState<InvestigationHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState("");
  const [provider, setProvider] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minRisk, setMinRisk] = useState("");
  const [maxRisk, setMaxRisk] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getCurrentUser().then(setUser).catch(() => router.replace("/login")); }, [router]);
  useEffect(() => {
    listInvestigations({ page, pageSize, search, verdict, provider, dateFrom, dateTo, minRisk, maxRisk, sort })
      .then((result) => { setError(""); setItems(result.items); setTotal(result.total); setTotalPages(result.totalPages); setSelected(new Set()); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load investigations."))
      .finally(() => setLoading(false));
  }, [page, refresh, search, verdict, provider, dateFrom, dateTo, minRisk, maxRisk, sort]);

  function resetPage(action: () => void) { action(); setPage(1); }
  function toggle(id: string) { setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function togglePage() { setSelected(items.length && items.every((item) => selected.has(item.id)) ? new Set() : new Set(items.map((item) => item.id))); }

  async function downloadSelected() {
    if (!selected.size) return;
    setBulkBusy(true); setError("");
    try {
      const report = await exportInvestigations([...selected]);
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `threattrace-investigations-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to export investigations."); }
    finally { setBulkBusy(false); }
  }

  async function removeSelected() {
    if (!selected.size || !window.confirm(`Delete ${selected.size} investigation${selected.size === 1 ? "" : "s"} and its saved email evidence? This cannot be undone.`)) return;
    setBulkBusy(true); setError("");
    try { await deleteInvestigations([...selected]); if (items.length === selected.size && page > 1) setPage(page - 1); else setRefresh((current) => current + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete investigations."); }
    finally { setBulkBusy(false); }
  }

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  return <main className={`${styles.shell} shell`}><AppHeader user={user} actionHref="/analyze/upload" actionLabel="+ New analysis" /><section className={styles.heading}><p className="kicker">INVESTIGATIONS</p><h1>Follow the evidence<br /><em>to a decision.</em></h1><p>Search, filter, and preserve the email evidence behind every decision.</p></section><section className={styles.controls} aria-label="Investigation filters"><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Search subject or sender" aria-label="Search investigations" /><select value={verdict} onChange={(event) => resetPage(() => setVerdict(event.target.value))} aria-label="Filter by verdict"><option value="">All verdicts</option><option>SAFE</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select><select value={provider} onChange={(event) => resetPage(() => setProvider(event.target.value))} aria-label="Filter by provider"><option value="">All providers</option><option value="GMAIL">Gmail</option><option value="OUTLOOK">Outlook</option><option value="EML">Uploaded .eml</option></select><input type="date" value={dateFrom} onChange={(event) => resetPage(() => setDateFrom(event.target.value))} aria-label="From date" /><input type="date" value={dateTo} onChange={(event) => resetPage(() => setDateTo(event.target.value))} aria-label="To date" /><div className={styles.riskRange}><input type="number" min="0" max="100" value={minRisk} onChange={(event) => resetPage(() => setMinRisk(event.target.value))} placeholder="Min risk" aria-label="Minimum risk score" /><span>–</span><input type="number" min="0" max="100" value={maxRisk} onChange={(event) => resetPage(() => setMaxRisk(event.target.value))} placeholder="Max risk" aria-label="Maximum risk score" /></div><select value={sort} onChange={(event) => resetPage(() => setSort(event.target.value))} aria-label="Sort investigations"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="riskHigh">Highest risk</option><option value="riskLow">Lowest risk</option><option value="emailDate">Email date</option></select></section>{error && <p className={styles.error} role="alert">{error}</p>}<section className={styles.listHeader}><label><input type="checkbox" checked={allSelected} onChange={togglePage} aria-label="Select all investigations on this page" /> Select page</label><span>{total} investigation{total === 1 ? "" : "s"}</span>{selected.size > 0 && <div className={styles.bulkActions}><strong>{selected.size} selected</strong><button onClick={() => void downloadSelected()} disabled={bulkBusy}>Export JSON</button><button className={styles.delete} onClick={() => void removeSelected()} disabled={bulkBusy}>Delete</button></div>}</section>{loading ? <p className="muted">Loading investigations...</p> : !items.length ? <section className={styles.empty}><h2>No matching investigations</h2><p>Try clearing a filter or analyze an email to create a new report.</p><Link href="/analyze/upload">Analyze an email</Link></section> : <section className={styles.list}>{items.map((item) => <article className={styles.row} key={item.id}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} aria-label={`Select ${item.subject || "investigation"}`} /><Link className={styles.report} href={`/investigations/${item.id}`}><span>{item.source} · {item.date ? new Date(item.date).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}</span><h2>{item.subject || "Untitled message"}</h2><p>{item.sender.email}</p></Link><strong className={item.riskScore >= 60 ? styles.high : item.riskScore >= 30 ? styles.medium : styles.low}>{item.verdict}<small>{item.riskScore}/100</small></strong><Link className={styles.open} href={`/investigations/${item.id}`}>Open report →</Link></article>)}</section>}<nav className={styles.pagination} aria-label="Investigation pages"><button disabled={loading || page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button disabled={loading || page === totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></nav></main>;
}
