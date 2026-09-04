export function RecentScans() {
  return (
    <section className="w-full bg-surface-container-low py-14 lg:py-18">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-tertiary">
                Your Inbox Safety Log
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest border border-surface-container shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-label text-[11px] font-semibold text-on-surface-variant">Connected: sarah.j@gmail.com</span>
              </div>
            </div>
            <h2 className="font-headline text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight normal-case !mb-0">
              Recent Scanned Emails
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
              A quick look at emails you've checked and their safety verdicts.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-label text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm transition-all" placeholder="Search by sender or email title..." type="text"/>
            </div>
            <button className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-label font-medium flex items-center gap-1.5 transition-colors shrink-0">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-container font-label text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
            <div className="col-span-2">Verdict</div>
            <div className="col-span-4">Email Title & Sender</div>
            <div className="col-span-3">What We Found</div>
            <div className="col-span-2">Scanned At</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-surface-container/60">
            <div className="p-5 lg:px-6 lg:py-4 hover:bg-surface-container-low transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-label font-semibold bg-emerald-100 text-emerald-800">
                  Safe
                </span>
              </div>
              <div className="lg:col-span-4 min-w-0">
                <div className="font-headline text-sm font-semibold text-on-surface truncate">
                  Google Account Security Alert
                </div>
                <div className="font-label text-xs text-on-surface-variant truncate mt-0.5">
                  From: Google Accounts &lt;no-reply@accounts.google.com&gt;
                </div>
              </div>
              <div className="lg:col-span-3 text-xs font-body text-on-surface-variant">
                Verified genuine sender, all links safe
              </div>
              <div className="lg:col-span-2 font-label text-xs text-on-surface-variant">
                Today at 2:22 PM
              </div>
              <div className="lg:col-span-1 flex justify-end">
                <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-label font-semibold transition-colors">
                  View Details
                </button>
              </div>
            </div>

            <div className="p-5 lg:px-6 lg:py-4 bg-error-container/10 hover:bg-error-container/20 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-label font-semibold bg-error text-on-error">
                  Scam Alert
                </span>
              </div>
              <div className="lg:col-span-4 min-w-0">
                <div className="font-headline text-sm font-semibold text-on-surface truncate">
                  Overdue Payment Invoice #8491
                </div>
                <div className="font-label text-xs text-error truncate mt-0.5 font-medium">
                  From: ACH Dispatch &lt;remittance@global-f1nance.net&gt; (Fake)
                </div>
              </div>
              <div className="lg:col-span-3 text-xs font-body text-error font-medium">
                Fake invoice attempting to steal banking details
              </div>
              <div className="lg:col-span-2 font-label text-xs text-on-surface-variant">
                Today at 12:48 PM
              </div>
              <div className="lg:col-span-1 flex justify-end">
                <button className="px-3.5 py-1.5 rounded-lg bg-error text-on-error hover:bg-error/90 text-xs font-label font-semibold transition-colors">
                  Review Why
                </button>
              </div>
            </div>

            <div className="p-5 lg:px-6 lg:py-4 hover:bg-surface-container-low transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-label font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                  Suspicious
                </span>
              </div>
              <div className="lg:col-span-4 min-w-0">
                <div className="font-headline text-sm font-semibold text-on-surface truncate">
                  Review &amp; Sign DocuSign Agreement
                </div>
                <div className="font-label text-xs text-on-surface-variant truncate mt-0.5">
                  From: DocuSign Secure &lt;dse@docusıgn-online.com&gt;
                </div>
              </div>
              <div className="lg:col-span-3 text-xs font-body text-tertiary font-medium">
                Fake document link, does not go to DocuSign
              </div>
              <div className="lg:col-span-2 font-label text-xs text-on-surface-variant">
                Today at 9:15 AM
              </div>
              <div className="lg:col-span-1 flex justify-end">
                <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-label font-semibold transition-colors">
                  View Details
                </button>
              </div>
            </div>

            <div className="p-5 lg:px-6 lg:py-4 hover:bg-surface-container-low transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-label font-semibold bg-error-container text-on-error-container">
                  Quarantined
                </span>
              </div>
              <div className="lg:col-span-4 min-w-0">
                <div className="font-headline text-sm font-semibold text-on-surface truncate">
                  Password Expiring Today - Keep Access
                </div>
                <div className="font-label text-xs text-on-surface-variant truncate mt-0.5">
                  From: MS 365 Admin &lt;notifications@m365-tenant-portal.org&gt;
                </div>
              </div>
              <div className="lg:col-span-3 text-xs font-body text-on-surface-variant">
                Urgent trick designed to capture your login credentials
              </div>
              <div className="lg:col-span-2 font-label text-xs text-on-surface-variant">
                Yesterday at 9:03 PM
              </div>
              <div className="lg:col-span-1 flex justify-end">
                <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-label font-semibold transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
