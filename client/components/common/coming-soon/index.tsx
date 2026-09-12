import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ComingSoon = ({
  icon: Icon,
  title,
  description,
}: ComingSoonProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
