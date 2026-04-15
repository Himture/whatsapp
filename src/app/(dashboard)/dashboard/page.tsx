import type { Metadata } from "next";
import { FirstRunWizard } from "@/components/onboarding/first-run-wizard";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <FirstRunWizard />
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-near-black">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-warm-500">
          At-a-glance state across your active workspace. Open the sidebar for everything else.
        </p>
      </div>

      <DashboardSummary />
    </div>
  );
}
