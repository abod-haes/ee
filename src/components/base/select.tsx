import { useMemo } from "react";
import Select, { type Props as SelectProps } from "react-select";
import { cn } from "@/lib/utils";

// Counter for generating unique instance IDs
let instanceCounter = 0;

// Ensure consistent IDs between server and client
const getNextInstanceId = () => {
  if (typeof window === "undefined") {
    // Server-side: use a predictable counter
    instanceCounter += 1;
    return `react-select-server-${instanceCounter}`;
  } else {
    // Client-side: use the same counter
    instanceCounter += 1;
    return `react-select-client-${instanceCounter}`;
  }
};

export interface Option {
  label: string;
  value: string;
}

interface BaseSelectProps extends Partial<SelectProps<Option, boolean>> {
  label?: string;
  error?: string;
  isMulti?: boolean;
  placeholder?: string;
}

const customStyles = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: (base: any) => ({
    ...base,
    width: "100%",
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: (base: any, state: any) => ({
    ...base,
    // padding: "8px 12px",
    borderRadius: "6px",
    border: state.isFocused ? "1px solid #ce1432" : "1px solid #e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(206, 20, 50, 0.1)" : "none",
    backgroundColor: "white",
    fontSize: "14px",
    width: "100%",
    "&:hover": {
      borderColor: "#ce1432",
    },
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu: (base: any) => ({
    ...base,
    zIndex: 9999,
    borderRadius: "6px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb",
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholder: (base: any) => ({
    ...base,
    color: "#6b7280",
    fontSize: "14px",
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  singleValue: (base: any) => ({
    ...base,
    color: "#231f20",
    fontSize: "14px",
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#ce1432"
      : state.isFocused
      ? "#fef2f2"
      : "white",
    color: state.isSelected ? "white" : "#231f20",
    fontSize: "14px",
    padding: "8px 12px",
    "&:hover": {
      backgroundColor: state.isSelected ? "#a70a25" : "#fef2f2",
    },
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indicatorSeparator: (base: any) => ({
    ...base,
    backgroundColor: "#e5e7eb",
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: state.isFocused ? "#ce1432" : "#6b7280",
    "&:hover": {
      color: "#ce1432",
    },
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearIndicator: (base: any) => ({
    ...base,
    color: "#6b7280",
    "&:hover": {
      color: "#ce1432",
    },
  }),
};

export const BaseSelect = ({
  label,
  error,
  options = [],
  isMulti = false,
  placeholder,
  ...props
}: BaseSelectProps) => {
  // Ensure component only renders on client side to prevent hydration issues
  const isClient = typeof window !== "undefined";

  // Generate a consistent instanceId to prevent hydration mismatches
  const instanceId = useMemo(() => {
    return getNextInstanceId();
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="w-full flex flex-col items-start">
        {label && (
          <label className="mb-1 text-[14px] font-normal text-[#231f20]">
            {label}
          </label>
        )}
        <div className="w-full h-10 bg-gray-100 rounded-md animate-pulse" />
        {error && (
          <span className="text-[12px] font-normal mt-1 text-[#f75555]">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start">
      {label && (
        <label
          className={cn(
            "mb-1 text-[14px] font-normal text-[#231f20]",
            error && "text-[#f75555]"
          )}
        >
          {label}
        </label>
      )}

      <Select
        placeholder={placeholder}
        styles={customStyles}
        options={options}
        isMulti={isMulti}
        instanceId={instanceId}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
        menuPosition="fixed"
        menuShouldBlockScroll={true}
        {...props}
      />

      {error && (
        <span className="text-[12px] font-normal mt-1 text-[#f75555]">
          {error}
        </span>
      )}
    </div>
  );
};
