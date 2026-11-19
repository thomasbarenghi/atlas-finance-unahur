import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  name?: string;
  className?: string;
  textClassName?: string;
}

const initialFrom = (name: string | undefined): string => {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
};

export const UserAvatar = ({
  name,
  className,
  textClassName,
}: UserAvatarProps) => {
  return (
    <span
      className={cn(
        "bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full font-semibold",
        className,
      )}
      aria-hidden
    >
      <span className={cn("text-xs", textClassName)}>{initialFrom(name)}</span>
    </span>
  );
};
