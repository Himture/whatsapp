"use client";

import { useState } from "react";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_PRESETS, type TemplatePreset } from "@/lib/template-presets";

interface TemplateGalleryProps {
  onUse: (preset: TemplatePreset) => void;
}

export function TemplateGallery({ onUse }: TemplateGalleryProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? TEMPLATE_PRESETS : TEMPLATE_PRESETS.slice(0, 4);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-notion-blue" />
          <h2 className="text-sm font-semibold text-near-black">Start from a preset</h2>
          <span className="text-xs text-warm-500">Meta-approved, ready to customize</span>
        </div>
        {TEMPLATE_PRESETS.length > 4 ? (
          <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <><X className="size-3.5" /> Collapse</> : <>Show all {TEMPLATE_PRESETS.length} <ChevronRight className="size-3.5" /></>}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onUse(preset)}
            className="text-left rounded-[var(--radius-subtle)] border border-black/10 bg-white p-4 hover:border-notion-blue hover:shadow-card transition-all"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-near-black">{preset.label}</p>
              <Badge variant="default" className="text-[10px]">{preset.category}</Badge>
            </div>
            <p className="mt-1 text-xs text-warm-500 line-clamp-2">{preset.description}</p>
            <p className="mt-2 text-xs text-notion-blue font-medium">Use this →</p>
          </button>
        ))}
      </div>
    </section>
  );
}
