import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For personal use and trying out LinkBox",
    color: "border-gray-200",
    badge: null,
    cta: "Get started",
    ctaStyle: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    features: [
      "1 Gmail account",
      "Daily inbox scan",
      "4 AI label categories",
      "Basic email dashboard",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For professionals who live in their inbox",
    color: "border-blue-500 ring-2 ring-blue-500",
    badge: "Most popular",
    cta: "Start free trial",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700",
    features: [
      "Up to 3 Gmail accounts",
      "Scan every 15 minutes",
      "AI draft generation",
      "Priority email scoring",
      "Bulk archive actions",
      "Email analytics",
      "Email support",
    ],
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "For teams and power users with heavy inboxes",
    color: "border-gray-200",
    badge: null,
    cta: "Contact us",
    ctaStyle: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    features: [
      "Unlimited Gmail accounts",
      "Scan every 5 minutes",
      "Everything in Pro",
      "Custom AI personas",
      "Team dashboard",
      "Unsubscribe manager",
      "Daily digest reports",
      "Priority support",
      "Custom integrations",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Pricing</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Simple, transparent pricing — upgrade or downgrade anytime
        </p>
      </header>

      <main className="flex-1 px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Take back control of your inbox
          </h2>
          <p className="text-gray-500">
            LinkBox uses AI to classify, draft, and filter your email
            automatically. Pick the plan that fits your workflow.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 ${plan.color} p-7 flex flex-col relative`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="#"
                className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Questions?{" "}
          <a href="mailto:hello@linkbox.app" className="text-blue-600 hover:underline">
            Get in touch
          </a>{" "}
          — we reply within 24 hours.
        </div>
      </main>
    </div>
  );
}
