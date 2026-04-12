"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  error?: string;
  description?: string;
  options: DropdownOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Dropdown({
  label,
  error,
  description,
  options,
  placeholder = "Select an option",
  value,
  onChange,
  required,
  disabled,
  className,
  id,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dropdownId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  const selectedOption = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      const focusedItem = items[focusedIndex];
      if (focusedItem instanceof HTMLElement) {
        focusedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, open]);

  function selectOption(option: DropdownOption) {
    onChange?.(option.value);
    close();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (open) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (open && focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (option) {
            selectOption(option);
          }
        } else {
          setOpen(true);
          setFocusedIndex(0);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        close();
        break;
      }
      case "Home": {
        if (open) {
          e.preventDefault();
          setFocusedIndex(0);
        }
        break;
      }
      case "End": {
        if (open) {
          e.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      {label && (
        <label
          id={`${dropdownId}-label`}
          className="text-sm font-medium text-near-black"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${dropdownId}-label` : undefined}
          aria-controls={open ? `${dropdownId}-listbox` : undefined}
          aria-invalid={error ? "true" : undefined}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
              if (!open) setFocusedIndex(selectedOption ? options.indexOf(selectedOption) : 0);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex w-full items-center justify-between rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-left text-base",
            "transition-colors duration-150",
            "focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20",
            "disabled:bg-warm-white disabled:text-warm-300 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            selectedOption ? "text-near-black" : "text-warm-300",
          )}
        >
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-warm-500 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <ul
            id={`${dropdownId}-listbox`}
            role="listbox"
            ref={listRef}
            aria-labelledby={label ? `${dropdownId}-label` : undefined}
            className={cn(
              "absolute z-50 mt-1 w-full overflow-auto rounded-[var(--radius-micro)] border-whisper bg-white py-1 shadow-card",
              "max-h-60",
              "animate-in fade-in slide-in-from-top-1 duration-150",
            )}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isFocused = index === focusedIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center px-3 py-2 text-sm transition-colors",
                    isFocused && "bg-warm-white",
                    isSelected && "font-medium text-notion-blue",
                    !isSelected && "text-near-black",
                  )}
                >
                  {option.label}
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-warm-300">No options available</li>
            )}
          </ul>
        )}
      </div>

      {description && !error && (
        <p className="text-xs text-warm-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}
