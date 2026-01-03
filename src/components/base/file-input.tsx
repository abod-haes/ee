import React, { useEffect, useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface FileInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange"
  > {
  id?: string;
  label?: string;
  error?: string;
  hint?: string;
  hideHint?: boolean;
  accept?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      id,
      className,
      label,
      error,
      hint,
      hideHint,
      accept = "image/*",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [fileName, setFileName] = useState<string | null>(null);

    useEffect(() => {
      if (value instanceof File) {
        setFileName(value.name);
      } else if (typeof value === "string") {
        setFileName(value);
      } else {
        setFileName(null);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileName(file?.name || null);
      onChange?.(file);
    };

    return (
      <div className="w-full flex flex-col items-start">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "mb-1 text-sm font-normal",
              error && "text-(--error)"
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "flex items-center gap-2 w-full rounded-md border bg-white px-3 py-2 text-sm",
            error ? "border-(--error)" : "border-(--primary-300)",
            className
          )}
        >
          <input
            id={id}
            type="file"
            accept={accept}
            className="hidden"
            ref={ref}
            onChange={handleChange}
            {...props}
          />

          <label
            className="break-all whitespace-normal w-full cursor-pointer"
            htmlFor={id}
          >
            {fileName || "اختيار صورة"}
          </label>
        </div>

        {!hideHint && (
          <span
            className={cn(
              "text-xs mt-1",
              error ? "text-(--error)" : "text-(--primary)"
            )}
          >
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
