"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface PatientQueueSearchProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  placeholder?: string;
}

export function PatientQueueSearch({
  value,
  onChange,
  totalCount,
  placeholder = "Search patient name or record number",
}: PatientQueueSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {isOpen && (
          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus
            className="min-w-0 flex-1 border border-paper-border bg-white px-3 py-2 text-xs text-charcoal outline-none focus:border-brand"
          />
        )}
        <button
          type="button"
          onClick={() => {
            if (isOpen) onChange("");
            setIsOpen((open) => !open);
          }}
          aria-label={isOpen ? "Close patient search" : "Search patients"}
          aria-expanded={isOpen}
          className="inline-flex shrink-0 items-center gap-1.5 border border-paper-border bg-white px-3 py-2 text-xs font-medium text-charcoal hover:border-brand"
        >
          {isOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          <span>{isOpen ? "Close" : "Search"}</span>
        </button>
      </div>
      <p className="text-[10px] text-charcoal-muted">
        {value.trim() ? `Search results across ${totalCount} patients waiting` : `Showing the 5 most recently updated of ${totalCount} patients`}
      </p>
    </div>
  );
}
