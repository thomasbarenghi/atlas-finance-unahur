import { PageHeader } from "@/components/common/page-header";
import { SettingsForm } from "@/components/features/settings/settings-form";
import { SettingsMenu } from "@/components/features/settings/settings-menu";

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajustes"
        description="Moneda base, privacidad y sesión."
      />
      <div className="md:hidden">
        <SettingsMenu />
      </div>
      <div className="hidden md:block">
        <SettingsForm />
      </div>
    </div>
  );
};

export default SettingsPage;
