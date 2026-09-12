import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DetailPageNotFoundProps,
  DetailPageProps,
  DetailPageSkeletonProps,
} from "./detail-page.types";

export const DetailPage = ({
  title,
  description,
  actions,
  children,
}: DetailPageProps) => (
  <div className="flex flex-col gap-6">
    <PageHeader title={title} description={description} actions={actions} />
    {children}
  </div>
);

export const DetailPageSkeleton = ({
  metricCount = 3,
}: DetailPageSkeletonProps) => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-9 w-40" />
    <Skeleton className="h-44 w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: metricCount }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-2xl" />
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
