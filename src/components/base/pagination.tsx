import * as React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export function Pagination({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <nav
      className={cn("mx-auto w-fit", className)}
      role="navigation"
      aria-label="pagination"
    >
      {children}
    </nav>
  );
}

export function PaginationContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul className={cn("flex items-center gap-2", className)}>{children}</ul>
  );
}

export function PaginationItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <li className={cn("list-none", className)}>{children}</li>;
}

type LinkProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  disabled?: boolean;
};

export function PaginationLink({
  className,
  isActive,
  disabled,
  children,
  ...props
}: LinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(
        "px-3 py-1 rounded border text-sm transition-colors",
        isActive
          ? "bg-(--primary-300) text-white border-(--primary-300)"
          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PaginationPrevious({
  className,
  disabled,
  ...props
}: LinkProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn(
        "flex items-center py-1.5 gap-2 bg-(--primary-300) text-white border-(--primary-300) hover:bg-(--primary-300)/90",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <Icons.chevronRight className="w-4 h-4" />
    </PaginationLink>
  );
}

export function PaginationNext({ className, disabled, ...props }: LinkProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn(
        "flex items-center py-1.5 gap-2 bg-(--primary-300) text-white border-(--primary-300) hover:bg-(--primary-300)/90",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <Icons.chevronLeft className="w-4 h-4" />
    </PaginationLink>
  );
}

export function PaginationEllipsis() {
  return (
    <span className="px-3 py-1 text-sm text-gray-500" aria-hidden>
      ...
    </span>
  );
}
