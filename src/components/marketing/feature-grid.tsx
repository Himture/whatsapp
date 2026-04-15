import {
  Inbox, Users, Megaphone, LayoutTemplate, GitBranch, BarChart3, CalendarClock, QrCode,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  { icon: Inbox, title: "Unified inbox", description: "Every conversation in one thread view. Reply inline. Works with any WhatsApp Cloud API account." },
  { icon: Users, title: "Contacts and lists", description: "Import CSV, tag, segment. Opt-out tracking built in. No extra fee." },
  { icon: Megaphone, title: "Rate-limited broadcasts", description: "Send to thousands with pause, resume, and retry. Quality rating-aware." },
  { icon: LayoutTemplate, title: "Template management", description: "Create, preview, submit, delete templates. Ten approved presets included." },
  { icon: GitBranch, title: "Auto-reply flows", description: "Keyword, greeting, first-message triggers. Instant replies via webhook." },
  { icon: BarChart3, title: "Real analytics", description: "Delivery and read rates with industry benchmarks. Not a data dump." },
  { icon: CalendarClock, title: "Scheduled messages", description: "Queue anything for future delivery. Cancel anytime before it fires." },
  { icon: QrCode, title: "QR codes and deep links", description: "Generate click-to-chat codes with prefilled messages. Download PNG." },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {FEATURES.map(({ icon: Icon, title, description }) => (
        <div key={title} className="rounded-[var(--radius-subtle)] border border-black/10 bg-white p-5">
          <Icon className="size-5 text-notion-blue" />
          <h3 className="mt-3 text-sm font-semibold text-near-black">{title}</h3>
          <p className="mt-1 text-sm text-warm-500 leading-relaxed">{description}</p>
        </div>
      ))}
    </div>
  );
}
