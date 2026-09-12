import type { EmptyStateProps } from "./empty-state.types";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground max-w-sm text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
};
