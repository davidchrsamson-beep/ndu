import SiteHeader from "@/components/market/SiteHeader";
import Hero from "@/components/market/Hero";
import CategoryNav from "@/components/market/CategoryNav";
import MarketSection from "@/components/market/MarketSection";
import ProductCard from "@/components/market/ProductCard";
import LiveNote from "@/components/market/LiveNote";
import SiteFooter from "@/components/market/SiteFooter";
import { sampleProducts } from "@/lib/sample-data";

export default function Home() {
  // Sample groupings for now; from the database step these become real queries.
  const topChoices = sampleProducts.slice(0, 6);
  const bestOfBudget = [...sampleProducts].sort((a, b) => a.priceKobo - b.priceKobo).slice(0, 6);
  const freshDrops = [...sampleProducts].reverse().slice(0, 4);
  const discover = sampleProducts.slice(2, 8);

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <CategoryNav active="all" />

        <MarketSection title="Top Choices">
          {topChoices.map((p) => <ProductCard key={p.id} product={p} />)}
        </MarketSection>

        <LiveNote>✨ New store just joined Ndu 10 hours ago — check them out</LiveNote>

        <MarketSection title="Best of Budget">
          {bestOfBudget.map((p) => <ProductCard key={p.id} product={p} variant="budget" />)}
        </MarketSection>

        <MarketSection title="Fresh Drops" icon="🆕">
          {freshDrops.map((p) => <ProductCard key={p.id} product={p} />)}
        </MarketSection>

        <LiveNote>🔥 &quot;Satin&quot; is the most ordered item this week</LiveNote>

        <MarketSection title="Discover" icon="✦">
          {discover.map((p) => <ProductCard key={p.id} product={p} variant="discover" />)}
        </MarketSection>

        <LiveNote>✨ &quot;Satin&quot; was just added by Kingof combo</LiveNote>
      </main>
      <SiteFooter />
    </>
  );
}