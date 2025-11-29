import { useLocalStorage } from "./useLocalStorage";

export interface Settings {
  expiryAlertDays: number;
  lowStockThreshold: number;
  restockReminder: "first-week" | "custom-day" | "every-15-days" | "off";
  customRestockDay?: number;
  categoryGrouping: boolean;
}

const defaultSettings: Settings = {
  expiryAlertDays: 14,
  lowStockThreshold: 10,
  restockReminder: "off",
  categoryGrouping: true,
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>("inven3-settings", defaultSettings);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings({ ...settings, ...updates });
  };

  return { settings, updateSettings };
}
