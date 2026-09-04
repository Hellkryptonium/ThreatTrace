import Link from "next/link";

export function Footer() {
  return (
    <div role="contentinfo" className="w-full bg-surface-container-low mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-inverse-surface flex items-center justify-center text-surface-container-lowest font-headline font-bold text-sm tracking-tight">T</div>
              <span className="font-headline font-bold tracking-tight text-on-surface text-sm">THREATTRACE</span>
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Easy-to-understand email security protecting families, teams, and individuals from everyday online scams.
            </p>
          </div>
          
          <div>
            <h4 className="font-label text-xs font-semibold tracking-wider uppercase text-tertiary mb-4">Overview</h4>
            <ul className="space-y-2.5 font-label text-xs">
              <li><Link href="/" className="text-on-surface-variant hover:text-on-surface transition-colors">Home Overview</Link></li>
              <li><Link href="/analyze/upload" className="text-on-surface-variant hover:text-on-surface transition-colors">Scan an Email</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-on-surface transition-colors">Recent Scanned Emails</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-on-surface transition-colors">Latest Scam Alerts</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-label text-xs font-semibold tracking-wider uppercase text-tertiary mb-4">Safety Guides</h4>
            <ul className="space-y-2.5 font-label text-xs">
              <li><Link href="/safety-guides" className="text-on-surface-variant hover:text-on-surface transition-colors">How to Spot a Phishing Email</Link></li>
              <li><Link href="/safety-guides" className="text-on-surface-variant hover:text-on-surface transition-colors">Protecting Your Bank Accounts</Link></li>
              <li><Link href="/safety-guides" className="text-on-surface-variant hover:text-on-surface transition-colors">What to Do if You Clicked a Link</Link></li>
              <li><Link href="/safety-guides" className="text-on-surface-variant hover:text-on-surface transition-colors">Family Safety Checklist</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-label text-xs font-semibold tracking-wider uppercase text-tertiary mb-4">Privacy & Peace of Mind</h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-on-surface font-label font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                <span>Never Reads or Stores Personal Emails</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface font-label font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                <span>SOC2 Certified & Bank-Grade Privacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface font-label font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary">delete_forever</span>
                <span>Automatic Deletion Immediately After Scan</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-label text-xs text-on-surface-variant">
          <p>© 2025 ThreatTrace Security. Simple, private protection for everyday inboxes.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-on-surface transition-colors">Privacy Commitment</Link>
            <Link href="/" className="hover:text-on-surface transition-colors">How We Protect Your Data</Link>
            <Link href="/" className="hover:text-on-surface transition-colors">Help & Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
