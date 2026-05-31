import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";
import { X } from "lucide-react";

interface Props {
  priceId: string;
  onClose: () => void;
}

export function StripeCheckoutModal({ priceId, onClose }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const secret = await createCheckoutSession({
      data: { priceId, returnUrl, environment: getStripeEnvironment() },
    });
    if (!secret) throw new Error("No client secret");
    return secret;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card shadow-glow my-8">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/80 transition"
          aria-label="Close checkout"
        >
          <X className="h-4 w-4" />
        </button>
        <div id="checkout" className="overflow-hidden rounded-2xl">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
