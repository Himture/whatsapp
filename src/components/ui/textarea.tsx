import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, error, description, id, ...props }, ref) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-near-black"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-danger">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-base text-near-black",
            "placeholder:text-warm-300 resize-y min-h-[80px]",
            "focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20",
            "disabled:bg-warm-white disabled:text-warm-300 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : description ? `${textareaId}-desc` : undefined
          }
          {...props}
        />
        {description && !error && (
          <p id={`${textareaId}-desc`} className="text-xs text-warm-500">
            {description}
          </p>
        )}
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
