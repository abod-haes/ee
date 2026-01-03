import { type ReactNode, useEffect, useRef } from "react";
import {
  createPopper,
  type Placement,
  type Instance as PopperInstance,
} from "@popperjs/core";

interface IDropdownProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  referenceElement: HTMLElement | null;
  placement?: Placement;
  offset?: [number, number];
  className?: string;
}

export function Dropdown({
  children,
  isOpen,
  onClose,
  referenceElement,
  placement = "bottom-start",
  offset = [0, 0],
  className,
}: IDropdownProps) {
  const popperRef = useRef<PopperInstance | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !referenceElement || !dropdownRef.current) return;

    popperRef.current = createPopper(referenceElement, dropdownRef.current, {
      placement,
      modifiers: [
        {
          name: "offset",
          options: { offset },
        },
        {
          name: "preventOverflow",
          options: { padding: 8 },
        },
      ],
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        referenceElement &&
        dropdownRef.current &&
        !referenceElement.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (popperRef.current) {
        popperRef.current.destroy();
        popperRef.current = null;
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, referenceElement, placement, offset, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className={className}>
      {children}
    </div>
  );
}
