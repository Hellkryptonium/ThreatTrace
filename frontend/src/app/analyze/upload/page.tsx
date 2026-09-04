"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadEmail } from "@/lib/api/emails";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { AppHeader } from "@/components/app-header";
import styles from "./upload.module.css";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [user, setUser] = useState<CurrentUser>();

  useEffect(() => { getCurrentUser().then(setUser).catch(() => { router.replace("/login"); }); }, [router]);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".eml")) {
      setError("Select an .eml file to begin an investigation.");
      setState("error");
      return;
    }
    setState("uploading");
    setError("");
    try {
      const result = await uploadEmail(file);
      router.push(`/investigations/${result.id}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setState("error");
    }
  }

  return (
    <main className={`${styles.shell} shell`}>
      <AppHeader user={user} actionHref="/emails" actionLabel="Gmail inbox" />
      <section className={styles.intro}><p className="kicker">NEW INVESTIGATION</p><h1>Inspect an email.<br /><em>Follow the evidence.</em></h1><p className={styles.lede}>Upload a raw message and ThreatTrace will extract its headers, links, authentication signals, and attachment fingerprints.</p></section>
      <button className={`${styles.dropzone} ${state === "uploading" ? styles.uploading : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]); }} disabled={state === "uploading"}>
        <span className={styles.uploadMark}>↑</span>
        <strong>{state === "uploading" ? "Analyzing message..." : "Drop an .eml file here"}</strong>
        <span>{state === "uploading" ? "Parsing headers and extracting indicators" : "or select a file from your computer"}</span>
        <small>Maximum file size is enforced by the API</small>
      </button>
      <input ref={inputRef} hidden type="file" accept=".eml,message/rfc822" onChange={(event) => void handleFile(event.target.files?.[0])} />
      {state === "error" && <p className={styles.error} role="alert">{error}</p>}
      <footer><span>Evidence-first email security</span><span>EML ANALYSIS / v1</span></footer>
    </main>
  );
}