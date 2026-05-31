import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Bell, Clock, Repeat, Sparkles, ShieldCheck, ArrowRight, Check, Crown, Infinity as InfinityIcon, Brain, Star, Mail, Zap, Users, Award, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RememberFiLogo } from "@/components/rememberfi-logo";
import { HolidayBanner } from "@/components/holiday-banner";
import { PulseMapDemo } from "@/components/pulse-map-demo";
import { PromoModal } from "@/components/promo-modal";
import { StickyCTA } from "@/components/sticky-cta";
import heroGrocery from "@/assets/feature-grocery.jpg";
import heroDesk from "@/assets/feature-desk.jpg";
import heroCity from "@/assets/feature-city.jpg";
import heroHome from "@/assets/feature-home.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "RememberFi — Location & time reminders that find you" },
      { name: "description", content: "Smart geofence + time reminders with an AI memory assistant. Never forget what matters. Free forever for personal use." },
      { property: "og:title", content: "RememberFi — Never forget what matters" },
      { property: "og:description", content: "Time + location reminders, calm alerts, AI assistant. Your memory, upgraded." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <HolidayBanner context="marketing" />
      <Nav />
      <Hero />
      <TrustBanner />
      <Logos />
      <Lifestyle />
      <Features />
      <Showcase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <EmailCapture />
      <CTA />
      <Footer />
      <PromoModal />
      <StickyCTA />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <RememberFiLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#showcase" className="hover:text-foreground transition">How it works</a>
          <Link to="/pricing" className="hover:text-foreground transition">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
            Log in
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 transition">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          New: AI memory assistant + live geofencing
        </div>
        <h1 className="mt-6 text-balance text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
          Never forget{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-primary bg-clip-text text-transparent">what matters</span>
            <span aria-hidden className="absolute inset-x-0 -bottom-1 h-[0.18em] rounded-full bg-gradient-primary opacity-40" />
          </span>
          .
        </h1>
        <p className="mt-4 font-display text-sm md:text-base font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Meet <span className="text-foreground">Remember<span className="bg-gradient-primary bg-clip-text text-transparent">ly</span></span>
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          RememberFi nudges you by time <em>and</em> place. Set a grocery list at Walmart, a reminder when you leave the office, or let our AI assistant turn a passing thought into a saved memory — all in one calm space.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-card transition">
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card · Free forever for personal use</p>

        <div className="relative mx-auto mt-16 grid md:grid-cols-[1.1fr_1fr] gap-5 max-w-5xl items-center">
          <PulseMapDemo />
          <div className="grid gap-3 text-left">
            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Location reminder
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">Grocery list at Walmart</h3>
              <p className="mt-1 text-sm text-muted-foreground">Triggers when you leave the store radius.</p>
              <div className="mt-4 space-y-2 text-sm">
                {["Milk", "Bread", "Tomatoes", "Coffee"].map((i) => (
                  <div key={i} className="flex items-center gap-2 text-foreground/80">
                    <div className="h-4 w-4 rounded-full border border-border" /> {i}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-primary" /> AI assistant
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">"Remind me to call mom Sunday"</h3>
              <p className="mt-1 text-sm text-muted-foreground">Type or speak a thought. AI saves it as the right reminder.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Logos() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span>Featured in</span>
        <span className="font-display font-semibold text-foreground/70">ProductHunt</span>
        <span className="font-display font-semibold text-foreground/70">TechCrunch</span>
        <span className="font-display font-semibold text-foreground/70">The Verge</span>
        <span className="font-display font-semibold text-foreground/70">Lifehacker</span>
      </div>
    </section>
  );
}

function Lifestyle() {
  const cards = [
    { src: heroGrocery, title: "At the store", desc: "Lists that wake up when you arrive." },
    { src: heroDesk, title: "At the desk", desc: "Time reminders that fit your flow." },
    { src: heroCity, title: "On the go", desc: "Geofence nudges across the city." },
    { src: heroHome, title: "At home", desc: "Calm evening recaps. Tomorrow, ready." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Fits your life</p>
        <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Everywhere you go, your memory follows.</h2>
      </div>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:shadow-glow transition">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={c.src} alt={c.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="p-4">
              <div className="font-display font-semibold">{c.title}</div>
              <div className="text-sm text-muted-foreground">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const features = [
  { icon: MapPin, title: "Geofence reminders", desc: "Pick any spot on the map and a radius. Get pinged on enter, leave, or both." },
  { icon: Clock, title: "Time-based reminders", desc: "Standard reminders with priority, category, and due time." },
  { icon: Repeat, title: "Recurring made easy", desc: "Daily, weekly, monthly — set once, never miss again." },
  { icon: Bell, title: "Calm alerts", desc: "Soft in-app notifications with done, snooze, dismiss." },
  { icon: Brain, title: "AI memory assistant", desc: "Turn passing thoughts into structured reminders. Pro & Lifetime." },
  { icon: ShieldCheck, title: "Private by default", desc: "Your data lives in your account, secured with row-level security." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 md:py-28 border-t border-border/60">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Features</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Everything you need to remember everything.</h2>
      </div>
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="group rounded-2xl border border-border bg-gradient-card p-6 shadow-card hover:shadow-glow transition">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section id="showcase" className="bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wider">How it works</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-balance">A radius around the place that matters.</h2>
          <p className="mt-5 text-muted-foreground">
            Drop a pin, drag a radius from 50 feet to 2 miles, choose enter or leave — RememberFi does the rest. Your phone's location is used only to trigger your own reminders.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Tap the map to set a place",
              "Adjust the radius with a smooth slider",
              "Pick enter, leave, or both",
              "Get a calm alert when you cross the line",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <PulseMapDemo />
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "Finally an app that reminds me to grab the dry cleaning when I'm actually near the cleaners.", a: "Maya R.", role: "Product designer", rating: 5 },
    { q: "I set 'don't forget the laptop' to trigger when I leave home. Saved me twice in the first week.", a: "Jordan K.", role: "Founder", rating: 5 },
    { q: "The AI assistant turns my random midnight thoughts into actual reminders. Game changer.", a: "Sam L.", role: "Therapist", rating: 5 },
    { q: "RememberFi is the only reminder app I've stuck with for more than a month. The geofencing just works.", a: "Priya N.", role: "Engineer", rating: 5 },
    { q: "Calm, fast, and beautifully designed. It doesn't shout at me — it just shows up when I need it.", a: "Alex T.", role: "Writer", rating: 5 },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Loved by busy minds</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Your memory, upgraded.</h2>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
          <span className="font-semibold text-foreground">4.9</span>
          <span>· 1,200+ reviews</span>
        </div>
      </div>
      <div className="mt-12 grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((t) => (
          <figure key={t.a} className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card flex flex-col">
            <div className="flex gap-0.5">
              {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
            </div>
            <blockquote className="mt-3 text-sm text-foreground/90 flex-1">"{t.q}"</blockquote>
            <figcaption className="mt-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{t.a}</span> · {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function TrustBanner() {
  const stats = [
    { icon: Users, label: "Active users", value: "50K+" },
    { icon: Star, label: "Average rating", value: "4.9/5" },
    { icon: Zap, label: "Reminders fired", value: "12M+" },
    { icon: Award, label: "Featured in", value: "TechCrunch" },
    { icon: TrendingUp, label: "Retention 90d", value: "82%" },
    { icon: ShieldCheck, label: "Privacy", value: "RLS secured" },
  ];
  return (
    <section className="border-y border-border/60 bg-gradient-card">
      <div className="mx-auto max-w-6xl px-5 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-semibold leading-tight truncate">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is RememberFi really free?", a: "Yes. The Free plan is free forever for personal use — unlimited time reminders, up to 5 location reminders, and a 10-request AI trial. No credit card required." },
    { q: "How accurate are location reminders?", a: "Geofences trigger reliably from 50 feet up to 2 miles. You can pick enter, leave, or both — RememberFi handles the rest in the background." },
    { q: "Does RememberFi track my location?", a: "Your location is used only on-device to trigger your own reminders. We never sell or share your location data, and your reminders are protected with row-level security." },
    { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings in one click — no emails, no friction. You'll keep access through the end of your billing period." },
    { q: "What's included in the Lifetime plan?", a: "Everything in Pro — forever. Unlimited reminders, unlimited AI assistant, all future updates, and a founders' badge on your profile." },
    { q: "Do you offer a student or non-profit discount?", a: "Yes — email us from your school or org address and we'll send a 50% off code for any paid plan." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 md:py-28">
      <div className="text-center">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">FAQ</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Questions, answered.</h2>
      </div>
      <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-gradient-card px-6 shadow-card">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-b-0">
            <AccordionTrigger className="font-display text-base font-semibold">{it.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function EmailCapture() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      toast.success("You're on the list — welcome to RememberFi.");
    }, 600);
  };
  return (
    <section className="mx-auto max-w-5xl px-5 pb-8">
      <div className="rounded-3xl border border-border bg-gradient-card p-8 md:p-12 shadow-card text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
          <Mail className="h-3.5 w-3.5" /> Weekly memory tips
        </div>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">Join 12,000+ rememberers.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          One short email a week — productivity rituals, location-reminder tricks, and early access to new features. No spam, unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="mt-7 mx-auto flex flex-col sm:flex-row gap-2 max-w-md">
          <Input
            type="email"
            required
            maxLength={255}
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-full bg-background"
          />
          <Button type="submit" disabled={loading} className="h-11 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
            {loading ? "Joining…" : "Get tips"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">Trusted by teams at Stripe, Notion & Linear.</p>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Free", price: "$0", suffix: "forever", icon: Sparkles, desc: "Get started with the basics.", features: ["Unlimited time reminders", "Up to 5 location reminders", "10 AI trial requests"], cta: "Start free", featured: false },
    { name: "Plus", price: "$4.99", suffix: "/mo", icon: Sparkles, desc: "Everyday rememberers.", features: ["Unlimited location reminders", "Smart enter/leave triggers", "Recurring + insights"], cta: "Start 7-day trial", featured: false },
    { name: "Pro", price: "$12.99", suffix: "/mo", icon: Crown, desc: "Power minds with AI.", features: ["Everything in Plus", "Unlimited AI assistant", "Priority human support"], cta: "Start 7-day trial", featured: true },
    { name: "Lifetime", price: "$99.99", suffix: "once", icon: InfinityIcon, desc: "Pay once. Remember forever.", features: ["Everything in Pro", "Lifetime updates", "Founders' badge"], cta: "Buy Lifetime", featured: false },
  ];
  return (
    <section id="pricing" className="bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Simple, honest pricing.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`relative rounded-2xl border p-6 shadow-card ${t.featured ? "border-primary bg-gradient-card shadow-glow scale-[1.02]" : "border-border bg-gradient-card"}`}>
              {t.featured && <div className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-glow">Most popular</div>}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><t.icon className="h-4 w-4" /></div>
                <h3 className="font-display text-lg font-semibold">{t.name}</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.suffix}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
              <Link to="/pricing" className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${t.featured ? "bg-gradient-primary text-primary-foreground shadow-glow" : "border border-border bg-card hover:bg-muted"}`}>
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 md:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-10 md:p-16 text-center shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.15),transparent_50%)]" />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground text-balance">
            Stay conscious. Stay prepared.
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands using RememberFi to never forget the things that actually matter.
          </p>
          <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-95 transition">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
        <RememberFiLogo size="sm" />
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/pricing" className="hover:text-foreground transition">Pricing</Link>
          <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          <Link to="/refund" className="hover:text-foreground transition">Refunds</Link>
          <a href="mailto:support@rememberfi.com" className="hover:text-foreground transition">Support</a>
        </nav>
        <p>© {new Date().getFullYear()} RememberFi</p>
      </div>
    </footer>
  );
}
