import { PageHeader } from "@/components/common/page-header";
import { ProfileMenu } from "@/components/features/profile/profile-menu";

const ProfilePage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi perfil" />
      <ProfileMenu />
    </div>
  );
};

export default ProfilePage;
