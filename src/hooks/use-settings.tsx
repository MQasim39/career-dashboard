
import { useState, useEffect, createContext, useContext } from "react";

interface Settings {
  displayName: string;
  emailNotifications: boolean;
  applicationReminders: boolean;
  interviewReminders: boolean;
  colorTheme: string;
  accentColor: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  displayName: "",
  emailNotifications: false,
  applicationReminders: false,
  interviewReminders: false,
  colorTheme: "dark",
  accentColor: "purple"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem("settings");
    
    if (savedSettings) {
      setSettings({
        ...defaultSettings,
        ...JSON.parse(savedSettings)
      });
    }
  }, []);

  // Save settings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
