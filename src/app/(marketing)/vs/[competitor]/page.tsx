import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompetitorSection } from "@/components/marketing/competitor-section";
import { COMPETITOR_SLUGS, getCompetitor, markupPercentage } from "@/lib/competitor-data";

type Params = Promise<{ competitor: string }>;

export function generateStaticParams() {
  return COMPETITOR_SLUGS.map((slug) => ({ competitor: slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { competitor: slug } = await params;
  const data = getCompetitor(slug);
  if (!data) return {};

  const pct = markupPercentage(data);
  return {
    title: `${data.name} alternative — stop paying ${pct}% markup`,
    description: `${data.tagline} See how much you're overpaying with our zero-markup calculator.`,
  };
}

export default async function CompetitorPage({ params }: { params: Params }) {
  const { competitor: slug } = await params;
  const data = getCompetitor(slug);
  if (!data) notFound();

  return <CompetitorSection competitor={data} />;
}
