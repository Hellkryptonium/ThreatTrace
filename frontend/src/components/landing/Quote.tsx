export function Quote() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 w-full">
      <div className="relative rounded-3xl bg-inverse-surface text-surface-container-lowest p-8 lg:p-14 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Ambient Decorative Overlay */}
        <div className="ambient-glow-drift absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Large Quote & Citation */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="flex items-center gap-2 text-tertiary-fixed">
              <span className="material-symbols-outlined text-[20px]">format_quote</span>
              <span className="font-label text-xs font-semibold uppercase tracking-widest">Our Human Safety Promise</span>
            </div>
            <blockquote className="font-headline text-2xl sm:text-3xl lg:text-4xl leading-snug font-normal text-white">
              &ldquo;You shouldn't have to be a tech expert to feel safe in your own inbox. Every email tells a story—ThreatTrace simply helps you read the truth.&rdquo;
            </blockquote>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/40 transition-transform duration-300 hover:scale-105">
                <img 
                  className="w-full h-full object-cover" 
                  data-alt="High-contrast black and white editorial portrait of a seasoned female cyber threat intelligence director in a minimalist modern operations center with subtle monitors in the background, sharp lighting, scholarly and authoritative." 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr4WOUX-wHwmZgElO1U8o3CMC8GbR6nyXQA3CkkrmQZty-mTWEfySp30qNoMpsN6nvd7Zq7LI6XD9qB-ewbaImTR6FD8wesGJfvxDVqptat5sR9csux17sPpAmjTBMcZkmAURkxIVcmI2jQt8vxR7v8ZE44OtxXXFB_prwCvSwB21fRIp4Lc8Gxl79PRwPyVh5-_DbP7Ni1tJfEylIjMGmcrRKZDh3jj_WJApVA2j0BSSWkLJM-dbj3g" 
                  alt="Dr. Aris Thorne" 
                />
              </div>
              <div>
                <div className="font-headline text-base font-semibold text-white">Founder</div>
                <div className="font-label text-xs text-surface-dim">ThreatTrace Team</div>
              </div>
            </div>
          </div>
          
          {/* Metric Accent Sidebar Card */}
          <div className="lg:col-span-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col space-y-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-label text-xs text-surface-dim uppercase tracking-wider">Scan Speed</span>
              <span className="font-headline font-semibold text-white">Under 1 Second</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-label text-xs text-surface-dim uppercase tracking-wider">Language</span>
              <span className="font-headline font-semibold text-white">100% Plain English</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label text-xs text-surface-dim uppercase tracking-wider">Peace of Mind</span>
              <span className="font-headline font-semibold text-white">Total Protection</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
