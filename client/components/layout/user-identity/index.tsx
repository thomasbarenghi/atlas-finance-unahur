import { UserAvatar } from "@/components/layout/user-avatar";
import { cn } from "@/lib/utils";

export interface UserIdentityProps {
  name?: string;
  email?: string;
  compact?: boolean;
  className?: string;
}

export const UserIdentity = ({
  name,
  email,
  compact,
  className,
}: UserIdentityProps) => {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <UserAvatar
        name={name}
        className={compact ? "size-7" : "size-11"}
        textClassName={
          compact ? "font-heading text-[11.5px] leading-[14px]" : "text-xs"
        }
      />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span
          className={cn(
            "text-ink truncate font-semibold",
            compact
              ? "text-[12.5px] leading-[17px]"
              : "text-[13.5px] leading-[18px]",
          )}
        >
          {name}
        </span>
        <span className="text-muted-foreground truncate text-[10.5px] leading-[14px]">
          {email}
        </span>
      </span>
    </div>
  );
};
