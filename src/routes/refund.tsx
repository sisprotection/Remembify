import { createFileRoute, Link } from "@tanstack/react-router";
import { RememberFiLogo } from "@/components/rememberfi-logo";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
  head: () => ({ meta: [{ title: "Refund Policy — RememberFi" }, { name: "description", content: "When and how we issue refunds for RememberFi subscriptions and lifetime plans." }] }),
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between">
          <Link to="/"><RememberFiLogo size="sm" /></Link>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">Back home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">We want you to love RememberFi. If it isn't working out, here's how we handle refunds.</p>

        <Block title="Monthly plans (Plus / Pro)">
          Cancel anytime in <strong>Settings → Manage billing</strong>. You'll keep access until the
          end of the current billing period; no further charges will be made. We don't pro-rate
          unused days, but if you were billed in the last 14 days and haven't used a premium feature,
          email us for a full refund.
        </Block>
        <Block title="Yearly plans">
          Full refund if requested within 14 days of purchase, provided you haven't used premium
          features extensively. After 14 days, refunds are pro-rated on a case-by-case basis.
        </Block>
        <Block title="Lifetime plan">
          30-day money-back guarantee. After 30 days, lifetime purchases are non-refundable.
        </Block>
        <Block title="In-app purchases (iOS / Android)">
          Refunds for purchases made through the App Store or Google Play are handled by Apple /
          Google directly. Visit reportaproblem.apple.com or play.google.com/store/account to request.
        </Block>
        <Block title="How to request">
          Email <a className="text-primary hover:underline" href="mailto:support@rememberfi.com">support@rememberfi.com</a>
          {" "}with your account email and order ID. We respond within 2 business days.
        </Block>
      </main>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
