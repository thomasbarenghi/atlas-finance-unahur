"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
      className="bg-muted hover:bg-muted/80 size-9 shrink-0 rounded-full md:hidden"
      onClick={() => router.back()}
    >
      <ChevronLeft className="size-5" />
    </Button>
  );
};
