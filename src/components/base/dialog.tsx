import React from "react";
import useBoolean from "@/hook/use-boolean";
import { Pop } from "./pop";
import { Button } from "./button";

export type DialogProp = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => Promise<void>;
  title?: string;
  head?: string;
  loading?: boolean;
  cta?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function Dialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  head,
  cta,
  subtitle,
  children,
}: DialogProp) {
  const loading = useBoolean(false);

  const handleSubmit = async () => {
    if (!onSubmit) return;

    loading.onTrue();
    await onSubmit();
    onClose();
    loading.onFalse();
  };

  const handleClose = () => {
    if (loading.value) return;
    onClose();
  };
  return (
    <Pop
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
    >
      {children || (
        <>
          <span className="my-3 block text-center text-[18px] capitalize">
            {head}
          </span>
          <div className="mt-6 flex items-center gap-3">
            <Button
              className="capitalize"
              type="submit"
              onClick={handleSubmit}
              disabled={loading.value}
            >
              {cta || "حذف"}
            </Button>
            <Button
              className="capitalize"
              variant={"ghost"}
              onClick={handleClose}
              disabled={loading.value}
            >
              الغاء
            </Button>
          </div>
        </>
      )}
    </Pop>
  );
}
