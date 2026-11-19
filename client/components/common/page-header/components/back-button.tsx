"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROOT_ROUTES } from "@/lib/sections";

export const BackButton = () => {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = ROOT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isRoot) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Volver"
      className="bg-card hover:bg-card text-ink2 border-line size-10 shrink-0 rounded-full border md:hidden"
      onClick={() => router.back()}
    >
      <ArrowLeft className="size-4" />
    </Button>
  );
};
