import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { RecentScans } from "@/components/landing/RecentScans";
import { Features } from "@/components/landing/Features";
import { Quote } from "@/components/landing/Quote";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Header />
      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          <Hero />
          <RecentScans />
          <Features />
          <Quote />
        </div>
      </main>
      <Footer />
    </div>
  );
}
