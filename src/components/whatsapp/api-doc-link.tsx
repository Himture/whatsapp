"use client";

import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { API_DOC_LINKS, POSTMAN_COLLECTION_URL } from "@/lib/constants";

export function ApiDocLink() {
  const pathname = usePathname();
  const linkInfo = API_DOC_LINKS[pathname];

  if (!linkInfo) return null;

  return (
    <div className="flex items-center gap-4 mt-2">
      <a
        href={linkInfo.docs}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-notion-blue hover:underline"
      >
        <ExternalLink className="size-3.5" />
        {linkInfo.label} Docs
      </a>
      <a
        href={POSTMAN_COLLECTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-near-black hover:underline"
      >
        <ExternalLink className="size-3.5" />
        Postman Collection
      </a>
    </div>
  );
}
