"use client";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Features() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 w-full">
      <div className="max-w-2xl mb-12">
        <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
          EASY TO UNDERSTAND
        </span>
        <h2 className="font-headline text-3xl lg:text-4xl font-semibold text-on-surface tracking-tight mt-2 mb-4 normal-case">
          How we protect you without the confusing jargon.
        </h2>
        <p className="font-body text-sm lg:text-base text-on-surface-variant leading-relaxed">
          You shouldn't need a degree in cybersecurity to stay safe. We do the heavy detective work and explain everything in simple words.
        </p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div 
          variants={cardVariants}
          className="feature-card-hover group bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer border border-transparent hover:border-primary/20"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-tertiary">STEP 01</span>
            <h3 className="font-headline text-lg font-semibold text-on-surface mt-2 mb-3 group-hover:text-primary transition-colors">
              1. Fake Sender Detection
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              We check the hidden sender details to make sure emails really come from the official company, not an impersonator.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-1.5 font-label text-xs text-primary font-semibold">
            <span>Guards real identities</span>
            <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-1">chevron_right</span>
          </div>
        </motion.div>
        
        <motion.div 
          variants={cardVariants}
          className="feature-card-hover group bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer border border-transparent hover:border-tertiary/20"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-tertiary group-hover:text-on-primary">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-tertiary">STEP 02</span>
            <h3 className="font-headline text-lg font-semibold text-on-surface mt-2 mb-3 group-hover:text-tertiary transition-colors">
              2. Scam Urgency Spotter
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Scams love pressure tactics like &quot;Act now or lose your account!&quot; Our AI spots manipulative and threatening wording instantly.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-1.5 font-label text-xs text-tertiary font-semibold">
            <span>Catches pressure tricks</span>
            <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-1">chevron_right</span>
          </div>
        </motion.div>
        
        <motion.div 
          variants={cardVariants}
          className="feature-card-hover group bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer border border-transparent hover:border-error/20"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-error group-hover:text-on-error">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-tertiary">STEP 03</span>
            <h3 className="font-headline text-lg font-semibold text-on-surface mt-2 mb-3 group-hover:text-error transition-colors">
              3. Safe Link & Attachment Scanner
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Wondering if a link or PDF is safe? We open it in an isolated digital room so dangerous viruses can never reach your device.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-1.5 font-label text-xs text-error font-semibold">
            <span>Safe quarantine tests</span>
            <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-1">chevron_right</span>
          </div>
        </motion.div>
        
        <motion.div 
          variants={cardVariants}
          className="feature-card-hover group bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer border border-transparent hover:border-inverse-surface/20"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-inverse-surface text-surface-container-lowest flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary">
              <span className="material-symbols-outlined text-[22px]">forum</span>
            </div>
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-tertiary">STEP 04</span>
            <h3 className="font-headline text-lg font-semibold text-on-surface mt-2 mb-3 group-hover:text-primary transition-colors">
              4. Clear, Human Advice
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              No cryptic error codes. You get a simple verdict: Safe, Caution, or Dangerous—along with clear instructions on what to do next.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-1.5 font-label text-xs text-on-surface font-semibold">
            <span>Plain language answers</span>
            <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:translate-x-1">chevron_right</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
