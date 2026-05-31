import { createFileRoute, Link } from "@tanstack/react-router";
import { RememberFiLogo } from "@/components/rememberfi-logo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({ meta: [{ title: "Terms of Service — RememberFi" }, { name: "description", content: "Terms governing your use of RememberFi." }] }),
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between">
          <Link to="/"><RememberFiLogo size="sm" /></Link>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">Back home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mt-1">Effective {new Date().getFullYear()}-01-01</p>

        <Block title="1. Acceptance">
          By creating an account, you agree to these Terms. If you don't agree, don't use the service.
        </Block>
        <Block title="2. The service">
          RememberFi provides reminders that trigger by time and/or geolocation, plus optional AI
          features. The service is provided "as is" — we work hard but can't guarantee a reminder
          will fire in every condition (no signal, OS killed background tasks, denied permissions, etc.).
          Don't rely on RememberFi for safety-critical situations.
        </Block>
        <Block title="3. Your account">
          You're responsible for keeping your password secure and for activity on your account.
          One person per account; no sharing credentials.
        </Block>
        <Block title="4. Acceptable use">
          No reverse-engineering, scraping, harassing users via the chat/ticket system, or using the
          AI assistant to generate illegal content. We may suspend accounts that violate these rules.
        </Block>
        <Block title="5. Subscriptions & payment">
          Paid plans renew automatically until canceled. You can cancel anytime in Settings →
          Manage billing. See our Refund Policy for refund terms.
        </Block>
        <Block title="6. Content you create">
          You own your reminders and notes. You grant us a limited license to store and display them
          back to you. We never sell them or train AI on them without explicit opt-in.
        </Block>
        <Block title="7. Termination">
          You can delete your account at any time from Settings. We may suspend accounts for breach
          of these Terms.
        </Block>
        <Block title="8. Limitation of liability">
          To the maximum extent permitted by law, our total liability is limited to the amount you
          paid us in the prior 12 months.
        </Block>
        <Block title="9. Contact">
          Questions? <a className="text-primary hover:underline" href="mailto:support@rememberfi.com">support@rememberfi.com</a>
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
