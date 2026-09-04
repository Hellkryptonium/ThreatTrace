import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-inverse-surface flex items-center justify-center text-surface-container-lowest font-headline font-bold text-xl tracking-tight shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold tracking-tight text-on-surface text-base leading-none">THREATTRACE</span>
              <span className="font-label text-[10px] tracking-widest uppercase text-tertiary font-semibold mt-1">Simple & Powerful Email Security</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-2">
            <Link href="/" aria-current="page" className="px-3 py-1.5 transition-colors bg-surface-container-high text-on-surface font-semibold rounded-lg text-sm font-label">
              Overview
            </Link>
            <Link href="/analyze/upload" className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-lg font-label">
              Check an Email
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/analyze/upload" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-label font-semibold tracking-wide transition-opacity hover:opacity-95 shadow-[0_2px_8px_rgba(9,76,178,0.2)]">
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Scan an Email</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
