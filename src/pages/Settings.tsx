
import SettingsForm from "@/components/settings/SettingsForm";

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      
      <SettingsForm />
    </div>
  );
};

export default Settings;
