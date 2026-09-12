"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/common/page-loader";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, isLoading, router]);

  return <PageLoader />;
};

export default Home;
