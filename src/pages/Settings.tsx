import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSettings, Settings as SettingsType } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/productHelpers";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Product } from "@/types/product";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [products] = useLocalStorage<Product[]>("inven3-products", []);
  const [customDay, setCustomDay] = useState(settings.customRestockDay?.toString() || "1");

  const handleExpiryDaysChange = (value: string) => {
    updateSettings({ expiryAlertDays: parseInt(value) });
    toast({
      title: "Settings Updated",
      description: `Expiry alert set to ${value} days before expiration`,
    });
  };

  const handleLowStockChange = (value: string) => {
    updateSettings({ lowStockThreshold: parseInt(value) });
    toast({
      title: "Settings Updated",
      description: `Low stock alert set to ${value} items`,
    });
  };

  const handleRestockReminderChange = (value: string) => {
    const reminderValue = value as SettingsType["restockReminder"];
    updateSettings({ restockReminder: reminderValue });
    toast({
      title: "Settings Updated",
      description: `Restock reminder ${value === "off" ? "disabled" : "updated"}`,
    });
  };

  const handleCustomDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(e.target.value);
    if (day >= 1 && day <= 31) {
      setCustomDay(e.target.value);
      updateSettings({ customRestockDay: day });
    }
  };

  const handleCategoryGroupingToggle = (checked: boolean) => {
    updateSettings({ categoryGrouping: checked });
    toast({
      title: "Settings Updated",
      description: checked ? "Category grouping enabled" : "Category grouping disabled",
    });
  };

  const handleExportCSV = () => {
    exportToCSV(products);
    toast({
      title: "Export Successful",
      description: "Inventory exported to CSV file",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Expiry Alert Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>Expiry Alert Threshold</CardTitle>
              <CardDescription>
                Get alerts when products are close to expiry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Alert me when expiry is within:</Label>
                <Select
                  value={settings.expiryAlertDays.toString()}
                  onValueChange={handleExpiryDaysChange}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="10">10 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="20">20 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert Threshold</CardTitle>
              <CardDescription>
                Get alerts when product quantity is running low
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Alert me when quantity is below:</Label>
                <Select
                  value={settings.lowStockThreshold.toString()}
                  onValueChange={handleLowStockChange}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 items</SelectItem>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="15">15 items</SelectItem>
                    <SelectItem value="20">20 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Restock Reminder */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Restock Reminder</CardTitle>
              <CardDescription>
                Set a reminder for regular restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reminder frequency:</Label>
                  <Select
                    value={settings.restockReminder}
                    onValueChange={handleRestockReminderChange}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="first-week">First week of every month</SelectItem>
                      <SelectItem value="custom-day">Custom day of month</SelectItem>
                      <SelectItem value="every-15-days">Every 15 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.restockReminder === "custom-day" && (
                  <div className="space-y-2">
                    <Label>Day of month (1-31):</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={customDay}
                      onChange={handleCustomDayChange}
                      className="h-12"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Grouping */}
          <Card>
            <CardHeader>
              <CardTitle>Category Grouping</CardTitle>
              <CardDescription>
                Group products by category on inventory page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Show products grouped by category</Label>
                <Switch
                  checked={settings.categoryGrouping}
                  onCheckedChange={handleCategoryGroupingToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Export Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Export Inventory</CardTitle>
              <CardDescription>
                Download your inventory as a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="lg"
                className="w-full h-12"
              >
                <Download className="h-5 w-5 mr-2" />
                Export to CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
