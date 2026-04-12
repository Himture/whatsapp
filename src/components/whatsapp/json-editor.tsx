"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface JsonEditorProps {
  value: unknown;
  onOverride: (json: unknown) => void;
  disabled?: boolean;
}

export function JsonEditor({ value, onOverride, disabled = false }: JsonEditorProps) {
  const [visible, setVisible] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const serialized = JSON.stringify(value, null, 2);
  const displayText = editedText ?? serialized;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;
      setEditedText(raw);
      try {
        const parsed: unknown = JSON.parse(raw);
        setError(undefined);
        onOverride(parsed);
      } catch {
        setError("Invalid JSON");
      }
    },
    [onOverride],
  );

  const handleReset = useCallback(() => {
    setEditedText(null);
    setError(undefined);
    onOverride(value);
  }, [value, onOverride]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          setVisible((v) => !v);
          if (visible) {
            setEditedText(null);
            setError(undefined);
          }
        }}
        disabled={disabled}
      >
        {visible ? "Hide JSON" : "Show JSON"}
      </Button>

      {visible && (
        <div className="space-y-2">
          <Textarea
            value={displayText}
            onChange={handleChange}
            disabled={disabled}
            error={error}
            className="font-mono text-sm min-h-[200px]"
          />
          {editedText !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
            >
              Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
