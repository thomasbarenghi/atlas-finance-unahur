import { Suspense } from "react";
import { AccountDetailView } from "@/app/(app)/accounts/detail/_components/account-detail-view";
import { DetailPageSkeleton } from "@/app/(app)/accounts/detail/_components/account-detail-view/components/detail-page";

const AccountDetailPage = () => {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <AccountDetailView />
    </Suspense>
  );
};

export default AccountDetailPage;
