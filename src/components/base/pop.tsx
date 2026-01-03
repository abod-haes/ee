import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/lib/icons";

interface PopProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  persistent?: boolean;
  subtitle?: string;
}

export const Pop: React.FC<PopProps> = ({
  isOpen,
  onClose,
  children,
  title,
  persistent,
  subtitle,
}) => {
  const handleOverlayClick = ({
    target,
    currentTarget,
  }: React.MouseEvent<HTMLDivElement>) => {
    if (target === currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={
              "flex justify-center items-center z-50 fixed w-screen h-screen inset-0 bg-[#73737336] backdrop-blur-sm z-1"
            }
            initial={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!persistent ? handleOverlayClick : undefined}
          >
            <motion.div
              className="max-w-[520px] md:max-w-[720px] w-[90%] max-h-[90vh] overflow-y-auto rounded-[8px] bg-[white] z-50 p-4.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[18px] capitalize font-medium">
                  {title}
                </span>
                <button className="cursor-pointer" onClick={onClose}>
                  <Icons.close className="size-6" />
                </button>
              </div>
              <div className="text-base mt-2 text-(--base-300)">{subtitle}</div>
              <div className="w-full">{children}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
