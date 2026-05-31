import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SovereignSeal } from "@/components/sovereign-seal";
import { SOVEREIGN, TC_VERSION } from "@/lib/sovereign";
import { toast } from "sonner";
import { Printer, Check } from "lucide-react";

export const Route = createFileRoute("/terms-gate")({
  component: TermsGate,
  head: () => ({ meta: [{ title: "Terms & Conditions — Sovereign Holdings LLC" }] }),
});

function TermsGate() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const accept = async () => {
    if (!checked || !user) return;
    setBusy(true);
    const { error } = await supabase.from("tc_consents").insert({
      user_id: user.id,
      version: TC_VERSION,
      user_agent: navigator.userAgent.slice(0, 500),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you. Welcome.");
    navigate({ to: "/dashboard" });
  };

  const decline = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-hero px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <SovereignSeal size={88} />
          <h1 className="mt-3 font-serif-display text-3xl font-semibold text-gold small-caps">{SOVEREIGN.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Terms & Conditions · Version {TC_VERSION}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-7 shadow-card backdrop-blur">
          <div className="flex items-center justify-between gap-3 no-print">
            <h2 className="font-serif-display text-xl font-semibold">Sovereign Holdings LLC — Terms of Service</h2>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>

          <div className="prose prose-invert mt-4 max-h-[55vh] overflow-y-auto pr-3 text-sm leading-relaxed text-muted-foreground space-y-4">
            <p className="text-xs uppercase tracking-wider text-gold">Effective Date: May 18, 2026 — Version {TC_VERSION}</p>
            <p>These Terms of Service ("Terms") form a binding agreement between you and {SOVEREIGN.name}, an Alabama limited liability company ("Sovereign Holdings", "we", "us"), governing your access to and use of the Vow of Embers platform and any related services (collectively, the "Services").</p>
            <p className="font-semibold text-foreground">BY CHECKING "I AGREE" YOU ACCEPT THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE SERVICES.</p>

            <p><strong className="text-foreground">1. Eligibility.</strong> You must be at least 13 years of age to use the Services. If you are under the age of majority in your jurisdiction, your parent or legal guardian must review and accept these Terms on your behalf. We comply with the Children's Online Privacy Protection Act (COPPA) and do not knowingly collect personal information from children under 13.</p>
            <p><strong className="text-foreground">2. Account and Username.</strong> You access the Services through a third-party identity provider (Apple or Google) or, where available, email and password. After first sign-in you must select a unique username. Your username is your only public-facing identity on the Services; your email address is never displayed as a credential. You are responsible for safeguarding your account and all activity that occurs under it.</p>
            <p><strong className="text-foreground">3. Virtual Goods.</strong> "Embers" (gems), cosmetics, and any other in-game items are limited, revocable, personal licenses to use a feature of the Services. They have NO monetary value, CANNOT be redeemed for cash, and CANNOT be transferred outside the Services. All purchases are FINAL except where required by law.</p>
            <p><strong className="text-foreground">4. Subscriptions and Auto-Renewal.</strong> Subscription plans renew automatically at the then-current price at the end of each billing period unless canceled before renewal. You may cancel at any time from your account settings or the Stripe customer portal. Cancellation takes effect at the end of the current billing period.</p>
            <p><strong className="text-foreground">5. Acceptable Use.</strong> You agree not to (a) cheat, exploit bugs, automate gameplay, or reverse-engineer the Services; (b) use the Services for unlawful purposes; (c) attempt to access another user's account; (d) interfere with the operation of the Services. We may suspend or terminate accounts that violate these Terms, with or without notice.</p>
            <p><strong className="text-foreground">6. Intellectual Property.</strong> All content, code, artwork, music, trademarks, and the {SOVEREIGN.name} seal are owned by Sovereign Holdings or its licensors. You are granted a limited, personal, non-exclusive, non-transferable license to use the Services for personal entertainment.</p>
            <p><strong className="text-foreground">7. Privacy.</strong> Our Privacy Policy explains what information we collect and how we use it. By accepting these Terms you also acknowledge the Privacy Policy.</p>
            <p><strong className="text-foreground">8. Disclaimers.</strong> THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION.</p>
            <p><strong className="text-foreground">9. Limitation of Liability.</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, {SOVEREIGN.name.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR AGGREGATE LIABILITY ARISING FROM OR RELATED TO THE SERVICES SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR (B) FIFTY US DOLLARS ($50.00).</p>
            <p><strong className="text-foreground">10. Indemnification.</strong> You agree to defend, indemnify, and hold harmless {SOVEREIGN.name} and its officers, members, employees, and agents from any claim or demand arising out of your breach of these Terms or your misuse of the Services.</p>
            <p><strong className="text-foreground">11. Governing Law and Venue.</strong> These Terms are governed by the laws of the State of Alabama and the United States of America, without regard to conflict-of-laws principles. Exclusive jurisdiction and venue for any dispute shall lie in the state or federal courts located in Alabama, and you consent to personal jurisdiction therein.</p>
            <p><strong className="text-foreground">12. Dispute Resolution.</strong> Before filing any claim you agree to first contact us in writing and attempt to resolve the dispute informally for at least thirty (30) days. Nothing in this section prevents either party from seeking injunctive relief in court.</p>
            <p><strong className="text-foreground">13. Changes to These Terms.</strong> We may update these Terms from time to time. When we do, we will publish a new version and require you to re-accept. Continued use of the Services after a new version becomes effective constitutes acceptance.</p>
            <p><strong className="text-foreground">14. FTC and Consumer Protection.</strong> We comply with the Federal Trade Commission Act and applicable state consumer protection statutes. Promotional claims, refund eligibility, and subscription disclosures are made in good faith.</p>
            <p><strong className="text-foreground">15. Contact.</strong> {SOVEREIGN.name} — {SOVEREIGN.contactEmail}</p>
            <p className="italic">By checking the box and clicking "I Agree" you confirm that you have read, understood, and accept these Terms in their entirety.</p>
          </div>


          <label className="mt-6 flex items-start gap-3 cursor-pointer no-print">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border border-input bg-background accent-[var(--color-primary)]"
            />
            <span className="text-sm">
              I have read, understood, and agree to the {SOVEREIGN.name} Terms & Conditions (Version {TC_VERSION}). I understand my consent is logged with a timestamp.
            </span>
          </label>

          <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 justify-between no-print">
            <button onClick={decline} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted">
              Decline & exit
            </button>
            <button
              onClick={accept}
              disabled={!checked || busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> I Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
