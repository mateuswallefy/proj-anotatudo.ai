import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import React from "react";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  children,
  width = "md",
}: AppDialogProps) {
  const maxWidth =
    width === "sm"
      ? "max-w-md"
      : width === "lg"
      ? "max-w-3xl"
      : "max-w-2xl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${maxWidth} w-full rounded-xl p-0 overflow-hidden`}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="p-2 rounded-full bg-muted">{icon}</div>}
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {title}
                </DialogTitle>
                {subtitle && (
                  <DialogDescription className="text-sm">
                    {subtitle}
                  </DialogDescription>
                )}
              </div>
            </div>

            <DialogClose asChild>
              <button className="rounded-full p-2 hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

