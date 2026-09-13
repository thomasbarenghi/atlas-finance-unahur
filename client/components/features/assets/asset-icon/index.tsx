import type { AssetType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ASSET_TYPE_ICONS } from "./asset-icon.utils";

export { ASSET_TYPE_ICONS } from "./asset-icon.utils";

export interface AssetIconProps {
  type: AssetType;
  className?: string;
}

export const AssetIcon = ({ type, className }: AssetIconProps) => {
  const Icon = ASSET_TYPE_ICONS[type];

  return (
    <span
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
};
