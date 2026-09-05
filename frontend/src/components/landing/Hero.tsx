"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.15 } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export function Hero() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepTitle, setScanStepTitle] = useState("");
  const [scanStepSub, setScanStepSub] = useState("");
  const [isScanComplete, setIsScanComplete] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0].name);
    }
  };

  const handleFileSelection = (fileName: string) => {
    setIsChecking(true);
    setScanStepTitle(`Inspecting: ${fileName}`);
    setScanStepSub("Verifying cryptographic digital signatures...");
    setScanProgress(25);

    setTimeout(() => {
      setScanStepTitle("Quarantining & sandbox testing links...");
      setScanStepSub("Checking embedded redirect hops against threat database");
      setScanProgress(70);
    }, 800);

    setTimeout(() => {
      setScanStepTitle("Scan Complete! Verdict generated.");
      setScanStepSub("Identified spoofed domain and deceptive login target");
      setScanProgress(100);
    }, 1600);

    setTimeout(() => {
      setIsChecking(false);
      setIsScanComplete(true);
      setScanProgress(15);
      
      setTimeout(() => setIsScanComplete(false), 1200);
    }, 2200);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-16 overflow-hidden">
      <div className="ambient-glow-drift absolute top-1/4 left-1/2 w-[760px] h-[360px] bg-gradient-to-tr from-primary/10 via-primary-fixed/25 to-transparent blur-3xl rounded-full pointer-events-none -z-10"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        <motion.div 
          className="lg:col-span-6 flex flex-col items-start space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-high shadow-sm hover:shadow transition-shadow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-label text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
              SIMPLE EMAIL SAFETY · NO TECH KNOWLEDGE NEEDED
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="font-headline text-4xl sm:text-5xl lg:text-6xl text-on-surface leading-[1.08] tracking-tight font-medium">
            Not sure if an email is safe?<br/>
            <span className="text-primary italic font-normal">Check it in seconds.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="font-body text-base lg:text-lg text-on-surface-variant leading-relaxed max-w-xl">
            Scammers pretend to be your bank, your boss, or tech support. ThreatTrace inspects suspicious messages and tells you—in plain English—if an email is safe to open, fake, or dangerous.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-1 w-full sm:w-auto">
            <button onClick={() => handleFileSelection('Account_Notice_Review.eml')} className="btn-shimmer-wrap group flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-sm font-semibold tracking-wide shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-y-0.5">upload_file</span>
              <span>Upload Suspicious Email</span>
            </button>
            <Link href="/login" className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span>Connect Gmail / Google Inbox</span>
            </Link>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-2 pt-1 font-label text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
            <span>🔒 100% Private. We inspect security signals without ever storing your personal messages.</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="pt-3 grid grid-cols-3 gap-3 w-full max-w-lg">
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-container">
              <span className="font-headline font-semibold text-lg text-on-surface tracking-tight">99.4%</span>
              <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mt-0.5">Scam Catch Rate</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-container">
              <span className="font-headline font-semibold text-lg text-on-surface tracking-tight">&lt; 1 Sec</span>
              <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mt-0.5">Scan Time</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-container">
              <span className="font-headline font-semibold text-lg text-on-surface tracking-tight">Zero-Log</span>
              <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mt-0.5">Privacy Guaranteed</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="lg:col-span-6 w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        >
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl shadow-surface-dim/40 p-6 lg:p-7 transition-all flex flex-col space-y-6 border border-surface-container-high/40">
            <div 
              className={`relative group cursor-pointer rounded-xl bg-surface-container-low hover:bg-surface-container p-6 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 border-dashed ${isDragging ? 'bg-primary-fixed/30 border-primary' : 'border-outline-variant/60 hover:border-primary/60 hover:shadow-md'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} onChange={handleFileChange} accept=".eml,.msg,.txt" className="absolute inset-0 opacity-0 cursor-pointer z-20" type="file" />
              <div className="w-12 h-12 rounded-xl bg-surface-container-high group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center text-primary transition-all duration-300 shadow-sm mb-3 group-hover:-translate-y-1">
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform duration-300">cloud_upload</span>
              </div>
              <h3 className="font-headline text-base font-semibold text-on-surface mb-1 transition-colors duration-200">
                Drop your suspicious email here to inspect
              </h3>
              <p className="font-body text-xs text-on-surface-variant max-w-sm mb-3">
                Drag and drop any email (.eml) or paste the message. We'll tell you if it's safe to click or reply.
              </p>
              <span className="px-3.5 py-1.5 rounded-lg bg-surface-container-highest text-on-surface font-label text-xs font-semibold group-hover:bg-primary group-hover:text-on-primary transition-all duration-200 shadow-sm">
                Browse files from your computer
              </span>
              
              <div className={`absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300 z-30 ${isChecking ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin mb-3"></div>
                <h4 className="font-headline text-sm font-semibold text-on-surface mb-1">{scanStepTitle}</h4>
                <p className="font-body text-[11px] text-on-surface-variant mb-3">{scanStepSub}</p>
                <div className="w-48 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300 rounded-full" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-xl bg-surface-container-low p-5 space-y-4 border border-surface-container-high/30 transition-all duration-300 hover:shadow-sm ${isScanComplete ? 'ring-2 ring-primary shadow-xl' : ''}`}>
              <div className="radar-sweep-beam pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-primary/10 to-transparent -z-0"></div>
              
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-label font-bold uppercase tracking-wider bg-error-container text-on-error-container">
                      Likely Scam
                    </span>
                    <span className="font-label text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                      EXAMPLE SCAN RESULT
                    </span>
                  </div>
                  <h4 className="font-headline text-sm font-semibold text-on-surface truncate">
                    Urgent Notice Pretending to be Microsoft
                  </h4>
                  <p className="font-body text-xs text-on-surface-variant truncate">
                    Claims to be from: IT Operations Desk &lt;security-alert@micr0s0ft-support.cloud&gt;
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                      <path className="risk-meter-circle text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                    </svg>
                    <span className="absolute font-headline text-xs font-bold text-error">88%</span>
                  </div>
                  <span className="font-label text-[10px] uppercase font-semibold text-error tracking-tight mt-0.5">High Danger</span>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-1 gap-2 text-xs font-label">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest transition-all duration-200 hover:translate-x-1 hover:shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-error shrink-0">cancel</span>
                  <div className="truncate">
                    <span className="font-semibold text-on-surface">Fake Sender:</span>
                    <span className="text-on-surface-variant"> Claims to be &quot;IT Support&quot;, but sent from an untrusted stranger&apos;s server.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest transition-all duration-200 hover:translate-x-1 hover:shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0">warning</span>
                  <div className="truncate">
                    <span className="font-semibold text-on-surface">Stolen Look:</span>
                    <span className="text-on-surface-variant"> The sender address uses lookalike letters designed to trick your eyes.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest transition-all duration-200 hover:translate-x-1 hover:shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-error shrink-0">link_off</span>
                  <div className="truncate">
                    <span className="font-semibold text-on-surface">Dangerous Link Inside:</span>
                    <span className="text-on-surface-variant"> The &quot;Login Here&quot; button directs to a copycat site that steals passwords.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest transition-all duration-200 hover:translate-x-1 hover:shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-error shrink-0">public_off</span>
                  <div className="truncate">
                    <span className="font-semibold text-on-surface">Hidden Origin:</span>
                    <span className="text-on-surface-variant"> Sent from an anonymous hidden network commonly used by scammers.</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2 flex items-center justify-between border-t border-transparent">
                <div className="flex items-center gap-2 text-[11px] font-label text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                  <span className="">Verdict: Do not click links or reply</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="group font-label text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors">
                    <span className="">See Full Explanation</span>
                    <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
                  </button>
                  <button className="font-label text-xs font-semibold text-error px-2.5 py-1 rounded bg-error-container/60 hover:bg-error-container hover:shadow-xs transition-all">
                    How to Safely Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
