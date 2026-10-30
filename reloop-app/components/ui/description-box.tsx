import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/field";

export function DescriptionBox({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  onFill,
  error,
  maxLength = 500,
  minLength = 24,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFill: () => void;
  error?: string;
  maxLength?: number;
  minLength?: number;
}) {
  const length = value.trim().length;
  const ready = length >= minLength;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={onFill}>
          Fill description
        </Button>
      </div>
      <TextArea
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
        {hint}
      </p>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {length}/{maxLength}
        {ready ? " · Enough detail to pass along" : ` · Add at least ${minLength} characters`}
      </p>
    </div>
  );
}
