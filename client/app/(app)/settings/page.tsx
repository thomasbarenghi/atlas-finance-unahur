import { PageHeader } from "@/components/common/page-header";
import { SettingsForm } from "@/components/features/settings/settings-form";

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ajustes" description="Tu perfil y tu sesión." />
      <SettingsForm />
    </div>
  );
};

export default SettingsPage;
