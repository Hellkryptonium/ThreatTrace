import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function SafetyGuidesPage() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Header />
      <main className="w-full pt-28 pb-20 bg-surface min-h-[calc(100vh-20rem)] max-w-4xl mx-auto px-6 lg:px-12">
        <h1 className="font-headline text-4xl text-on-surface font-semibold mb-6">Safety Guides</h1>
        <p className="font-body text-on-surface-variant mb-12">
          Learn how to protect yourself and your family from online threats. These guides offer simple, actionable advice.
        </p>
        
        <div className="space-y-8">
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container">
            <h2 className="font-headline text-xl text-on-surface font-semibold mb-2">How to Spot a Phishing Email</h2>
            <p className="font-body text-sm text-on-surface-variant">Phishing emails are designed to look like they come from legitimate organizations. Learn the common signs, such as urgent language, generic greetings, and mismatched sender addresses.</p>
          </div>
          
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container">
            <h2 className="font-headline text-xl text-on-surface font-semibold mb-2">Protecting Your Bank Accounts</h2>
            <p className="font-body text-sm text-on-surface-variant">Your bank will never ask for your password or PIN via email. Discover how to safely verify communications and protect your financial data.</p>
          </div>
          
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container">
            <h2 className="font-headline text-xl text-on-surface font-semibold mb-2">What to Do if You Clicked a Link</h2>
            <p className="font-body text-sm text-on-surface-variant">Accidents happen. If you accidentally clicked a suspicious link, immediately disconnect from the internet, run a malware scan, and change your passwords.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
