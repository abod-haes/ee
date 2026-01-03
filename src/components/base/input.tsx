import React, { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  id?: string;
  type?: string;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  hideHint?: boolean;
  preIcon?: ReactNode;
  afterIcon?: ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      className,
      type = "text",
      label,
      error,
      hint,
      hideHint,
      preIcon,
      afterIcon,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setPasswordVisibility] = useState(false);
    const isDisabled = props.disabled;

    const togglePasswordVisibility = () => {
      setPasswordVisibility((prev) => !prev);
    };

    return (
      <div className="w-full flex flex-col items-start">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "mb-1 text-[14px] font-normal text-(--silver)",
              error && "text-[#f75555]"
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "flex items-center gap-2 w-full rounded-md border bg-white text-sm text-[#231f20] placeholder:text-[#6b7280] min-h-[40px] transition-colors duration-200",
            error
              ? "border-[#f75555] focus-within:border-[#f75555] focus-within:ring-2 focus-within:ring-red-100"
              : "border-[#e5e7eb] focus-within:border-[#ce1432] focus-within:ring-2 focus-within:ring-red-100 hover:border-[#ce1432]",
            isDisabled &&
              "bg-gray-100 text-[#9ca3af] border-[#e5e7eb] cursor-not-allowed focus-within:ring-0 focus-within:border-[#e5e7eb] hover:border-[#e5e7eb]",
            className
          )}
        >
          {preIcon && type !== "password" && (
            <div
              className={cn(
                "size-5 flex items-center mr-2 justify-center",
                isDisabled && "opacity-50"
              )}
            >
              {preIcon}
            </div>
          )}

          <input
            id={id}
            type={
              type === "password"
                ? isPasswordVisible
                  ? "text"
                  : "password"
                : type || "text"
            }
            placeholder={placeholder}
            className={cn(
              "w-full  px-3 py-2 outline-none pe-3 text-[14px] bg-transparent placeholder:text-[#6b7280] focus:placeholder:opacity-0 transition-all duration-200",
              isDisabled &&
                "cursor-not-allowed pointer-events-none text-[#9ca3af] placeholder:text-[#9ca3af]"
            )}
            ref={ref}
            suppressHydrationWarning
            {...props}
          />

          {afterIcon && type !== "password" && (
            <div
              className={cn(
                "size-5 flex items-center justify-center",
                isDisabled && "opacity-50"
              )}
            >
              {afterIcon}
            </div>
          )}

          {type === "password" && (
            <div
              className={cn(
                "size-5 flex items-center ml-2 justify-center cursor-pointer text-gray-500 hover:text-gray-700 transition-colors",
                isDisabled &&
                  "opacity-50 cursor-not-allowed pointer-events-none hover:text-gray-500"
              )}
              onClick={isDisabled ? undefined : togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <Icons.eyeOff size={20} />
              ) : (
                <Icons.view size={20} />
              )}
            </div>
          )}
        </div>

        {!hideHint && (
          <span
            className={cn(
              "text-[12px] font-normal mt-1",
              error ? "text-[#f75555]" : "text-[#ce1432]"
            )}
          >
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
