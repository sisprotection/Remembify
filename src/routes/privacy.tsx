import { createFileRoute, Link } from "@tanstack/react-router";
import { RememberFiLogo } from "@/components/rememberfi-logo";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: "Privacy Policy — RememberFi" }, { name: "description", content: "How RememberFi collects, uses, and protects your data." }] }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between">
          <Link to="/"><RememberFiLogo size="sm" /></Link>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">Back home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective: {new Date().getFullYear()}-01-01 · Owner: Domenick Arlon Hall, President</p>

        <Section title="1. Who we are">
          RememberFi (operated by Domenick Arlon Hall) provides a time-and-location reminder
          service available on the web and as a mobile app. You can reach us at{" "}
          <a href="mailto:support@rememberfi.com">support@rememberfi.com</a>.
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account info</strong> — email, display name, profile picture (if you choose).</li>
            <li><strong>Reminders</strong> — titles, notes, due dates, categories, and any location coordinates you save.</li>
            <li><strong>Device location</strong> — only while the app is running and only to evaluate geofences you created. We do not store your live location.</li>
            <li><strong>Usage events</strong> — anonymous error logs and basic analytics to keep the service reliable.</li>
            <li><strong>Payment data</strong> — handled entirely by Stripe; we never see your card number.</li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          To deliver reminders, sync your account across devices, process subscriptions, prevent
          abuse, respond to support requests, and improve product quality. We do not sell your data.
        </Section>

        <Section title="4. Third-party processors">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database, authentication, file storage.</li>
            <li><strong>Stripe</strong> — payments and subscription billing.</li>
            <li><strong>Lovable AI / OpenAI / Google</strong> — AI assistant requests (only the text you submit to AI features).</li>
            <li><strong>OpenStreetMap</strong> — map tiles (your IP is visible to the tile provider while a map is open).</li>
          </ul>
        </Section>

        <Section title="5. Your rights">
          You can view, edit, export, or permanently delete your data at any time from
          Settings → Danger zone. Deletion removes your account from our database within 7 days.
          EU/UK residents have additional rights under GDPR; California residents under CCPA. Email
          <a href="mailto:support@rememberfi.com"> support@rememberfi.com</a> for any request.
        </Section>

        <Section title="6. Children">
          RememberFi is not directed at children under 13. We do not knowingly collect data from minors.
        </Section>

        <Section title="7. Changes">
          We'll post material changes here and notify you via email or in-app banner before they take effect.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-xl font-semibold mt-6 mb-2">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
