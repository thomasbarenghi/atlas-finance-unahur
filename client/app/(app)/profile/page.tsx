import Link from "next/link";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ProfileMenu } from "@/app/(app)/profile/_components/profile-menu";
import { SECTIONS } from "@/lib/sections";

const ProfilePage = () => {
  return (
    <div className="flex flex-col gap-3.5">
      <PageHeader
        title="Mi perfil"
        description="Cuenta de demostración"
        actions={
          <Link
            href={SECTIONS.settings.href}
            aria-label="Editar perfil"
            className="border-line text-ink2 bg-card flex size-9 items-center justify-center rounded-full border md:hidden"
          >
            <Pencil className="size-[15px]" aria-hidden />
          </Link>
        }
      />
      <ProfileMenu />
    </div>
  );
};

export default ProfilePage;
