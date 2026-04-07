import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  // 🔥 EVENTOS IMPORTANTES
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email;

      // 🔥 DEFINE PLANO PELO PRICE_ID
      const priceId = session.items?.data[0]?.price?.id;

      let plano = "basico";

      if (priceId === "price_1TJg8HFjaswz9WcmLtUD1Wzk") plano = "pro";
      if (priceId === "price_1TJg99Fjaswz9WcmOhX7PsvZ") plano = "premium";

      // 🔥 ATUALIZA USUÁRIO
      await supabase
        .from("usuarios")
        .update({
          plano,
          status: "ativo",
        })
        .eq("email", email);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId = subscription.customer as string;

      await supabase
        .from("usuarios")
        .update({
          status: "inativo",
        })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId = invoice.customer as string;

      await supabase
        .from("usuarios")
        .update({
          status: "inativo",
        })
        .eq("stripe_customer_id", customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}