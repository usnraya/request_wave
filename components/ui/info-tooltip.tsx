"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small "i" icon; hover, click, tap, or keyboard focus+Enter shows a short plain-language explanation. */
export default function InfoTooltip({
  text,
  label,
  className,
}: {
  text: string;
  /** Name of the thing explained; used for the screen-reader label. */
  label?: string;
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        closeDelay={100}
        aria-label={label ? `Penjelasan: ${label}` : "Penjelasan"}
        className={cn(
          "inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 outline-none transition-colors hover:text-foreground data-[popup-open]:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={8} collisionPadding={12} className="z-50">
          <Popover.Popup className="max-w-64 rounded-xl border border-border bg-popover px-3 py-2 text-xs font-normal normal-case leading-5 tracking-normal text-popover-foreground shadow-lg outline-none transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            {text}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
