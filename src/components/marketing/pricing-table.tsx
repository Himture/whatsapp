import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { PLAN_LIMITS, ROUTES, GITHUB_URL } from "@/lib/constants";
import { PLAN_ORDER, PLAN_FEATURES, PLAN_TAGLINES } from "@/lib/plan-data";
import { cn } from "@/lib/utils";

function formatPrice(inr: number): string {
  if (inr === 0) return "Free";
  return `₹${inr.toLocaleString("en-IN")}`;
}

export function PricingTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLAN_ORDER.map((plan) => {
        const limits = PLAN_LIMITS[plan];
        const featured = plan === "starter";
        return (
          <div
            key={plan}
            className={cn(
              "rounded-[var(--radius-comfortable)] border p-6 flex flex-col",
              featured ? "border-notion-blue ring-1 ring-notion-blue/30 bg-white" : "border-black/10 bg-white",
            )}
          >
            {featured ? (
              <span className="inline-flex self-start rounded-full bg-notion-blue/10 text-notion-blue text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 mb-2">
                Recommended
              </span>
            ) : null}
            <p className="text-sm font-semibold text-warm-500 uppercase tracking-wide">{limits.label}</p>
            <p className="mt-3 text-3xl font-bold text-near-black">
              {formatPrice(limits.priceInr)}
              {limits.priceInr > 0 ? <span className="text-sm font-normal text-warm-500"> /mo</span> : null}
            </p>
            <p className="mt-2 text-sm text-warm-500 min-h-[2.5rem]">{PLAN_TAGLINES[plan]}</p>
            <Link
              href={plan === "free" ? GITHUB_URL : ROUTES.SIGNUP}
              className={cn(
                "mt-5 rounded-[var(--radius-micro)] px-4 py-2 text-sm font-semibold text-center transition-colors",
                featured ? "bg-notion-blue text-white hover:bg-active-blue" : "bg-near-black text-white hover:bg-warm-600",
              )}
            >
              {plan === "free" ? "Self-host on GitHub" : "Start free trial"}
            </Link>

            {!compact ? (
              <ul className="mt-6 space-y-2 text-sm">
                {PLAN_FEATURES.map((feature) => {
                  const value = feature.getValue(plan);
                  return (
                    <li key={feature.label} className="flex items-start gap-2">
                      {typeof value === "boolean" ? (
                        value ? (
                          <Check className="size-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <Minus className="size-4 text-warm-500 shrink-0 mt-0.5" aria-hidden="true" />
                        )
                      ) : (
                        <span className="font-mono text-xs bg-warm-100 rounded px-1.5 py-0.5 text-near-black shrink-0 mt-0.5">
                          {value}
                        </span>
                      )}
                      <span className={cn("text-warm-500", typeof value === "boolean" && !value && "line-through opacity-50")}>
                        {feature.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
