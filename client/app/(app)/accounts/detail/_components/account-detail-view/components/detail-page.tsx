import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface DetailPageProps {
  title: string;
  actions?: ReactNode;
  titleSize?: "default" | "compact";
  children: ReactNode;
}

export interface DetailPageNotFoundProps {
  entityLabel: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const DetailPage = ({
  title,
  actions,
  titleSize,
  children,
}: DetailPageProps) => (
  <div className="flex flex-col gap-3.5 md:gap-[18px]">
    <PageHeader title={title} actions={actions} titleSize={titleSize} />
    {children}
  </div>
);

export const DetailPageSkeleton = () => (
  <div className="flex flex-col gap-5">
    <Skeleton className="h-9 w-40" />
    <Skeleton className="h-36 w-full rounded-3xl" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-[66px] rounded-2xl" />
      ))}
    </div>
  </div>
);

export const DetailPageNotFound = ({
  entityLabel,
  icon,
  title,
  description,
}: DetailPageNotFoundProps) => (
  <DetailPage title={entityLabel}>
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={
        <Button asChild>
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      }
    />
  </DetailPage>
);
