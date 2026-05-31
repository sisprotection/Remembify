import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight, Sparkles, Crown, Infinity as InfinityIcon } from "lucide-react";
import { RememberFiLogo } from "@/components/rememberfi-logo";
import { HolidayBanner } from "@/components/holiday-banner";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { StripeCheckoutModal } from "@/components/stripe-checkout-modal";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — RememberFi | Geofence reminders that find you" },
      { name: "description", content: "Free forever for personal use. Plus $4.99/mo, Pro $12.99/mo with AI assistant, or one-time Lifetime for $99.99. Location + time reminders that never forget." },
      { property: "og:title", content: "RememberFi Pricing" },
      { property: "og:description", content: "From free to lifetime — pick a plan that remembers everything you don't." },
    ],
  }),
});

const TIERS = [
  {
    name: "Free", price: "$0", suffix: "forever", icon: Sparkles,
    desc: "Get started with the basics.",
    features: ["Unlimited time reminders", "Up to 5 location reminders", "10 AI assistant requests (trial)", "Mobile + web access"],
    cta: "Start free", featured: false, tier: "free", priceId: null as string | null,
  },
  {
    name: "Plus", price: "$4.99", suffix: "/month", icon: Sparkles,
    desc: "For everyday rememberers.",
    features: ["Unlimited location reminders", "Smart enter/leave triggers", "Recurring reminders", "Reminder history & insights", "Priority alerts"],
    cta: "Get Plus", featured: false, tier: "plus", priceId: "plus_monthly",
  },
  {
    name: "Pro", price: "$12.99", suffix: "/month", icon: Crown,
    desc: "For power minds who want AI.",
    features: ["Everything in Plus", "Unlimited AI assistant", "AI auto-saves your thoughts as reminders", "Voice-to-reminder dictation", "Priority human support", "Early access to new features"],
    cta: "Get Pro", featured: true, tier: "pro", priceId: "pro_monthly",
  },
  {
    name: "Lifetime", price: "$99.99", suffix: "one-time", icon: InfinityIcon,
    desc: "Pay once. Remember forever.",
    features: ["Everything in Pro", "Lifetime updates", "Never billed again", "Founders' badge", "Priority feature requests"],
    cta: "Buy Lifetime", featured: false, tier: "lifetime", priceId: "lifetime_once",
  },
];

function PricingPage() {
  const { user } = useAuth();
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const handleCheckout = (tier: string, priceId: string | null) => {
    if (tier === "free" || !priceId) {
      window.location.href = "/signup";
      return;
    }
    if (!user) {
      toast.info("Please sign in first", { description: "Create an account to start your subscription." });
      window.location.href = `/signup?next=/pricing`;
      return;
    }
    setCheckoutPriceId(priceId);
  };

  return (
    <div className="min-h-screen bg-hero">
      <PaymentTestModeBanner />
      <HolidayBanner context="marketing" />
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <RememberFiLogo />
          <nav className="flex items-center gap-2">
            <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition">Home</Link>
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition">Log in</Link>
            <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Pay for what you'll <span className="bg-gradient-primary bg-clip-text text-transparent">remember</span>.
          </h1>
          <p className="mt-5 text-muted-foreground text-lg">Simple plans. No hidden fees. Cancel anytime.</p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t) => (
            <div key={t.name} className={`relative rounded-2xl border p-6 shadow-card transition hover:shadow-glow ${t.featured ? "border-primary bg-gradient-card shadow-glow scale-[1.02]" : "border-border bg-gradient-card"}`}>
              {t.featured && <div className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-glow">Most popular</div>}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><t.icon className="h-4 w-4" /></div>
                <h3 className="font-display text-lg font-semibold">{t.name}</h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.suffix}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{f}</span></li>
                ))}
              </ul>
              <button onClick={() => handleCheckout(t.tier, t.priceId)} className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${t.featured ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95" : "border border-border bg-card hover:bg-muted"}`}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur text-center">
          <p className="text-sm text-muted-foreground">
            💳 Secure checkout · 🔒 Cancel anytime · 🇺🇸 Tax handled automatically
          </p>
        </div>
      </main>

      {checkoutPriceId && (
        <StripeCheckoutModal
          priceId={checkoutPriceId}
          onClose={() => setCheckoutPriceId(null)}
        />
      )}
    </div>
  );
}
