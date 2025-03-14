
import { useState, useEffect } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

const SettingsForm = () => {
  const { toast: showToast } = useToast();
  const { settings, updateSettings } = useSettings();
  
  const [displayName, setDisplayName] = useState(settings.displayName || "");
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications || false);
  const [applicationReminders, setApplicationReminders] = useState(settings.applicationReminders || false);
  const [interviewReminders, setInterviewReminders] = useState(settings.interviewReminders || false);
  const [colorTheme, setColorTheme] = useState(settings.colorTheme || "dark");
  const [accentColor, setAccentColor] = useState(settings.accentColor || "purple");
  const [saveDisabled, setSaveDisabled] = useState(true);

  // Check if settings have changed to enable/disable save button
  useEffect(() => {
    const settingsChanged = 
      displayName !== settings.displayName ||
      emailNotifications !== settings.emailNotifications ||
      applicationReminders !== settings.applicationReminders ||
      interviewReminders !== settings.interviewReminders ||
      colorTheme !== settings.colorTheme ||
      accentColor !== settings.accentColor;
    
    setSaveDisabled(!settingsChanged);
  }, [
    displayName, 
    emailNotifications, 
    applicationReminders, 
    interviewReminders, 
    colorTheme,
    accentColor,
    settings
  ]);

  const handleSave = () => {
    updateSettings({
      displayName,
      emailNotifications,
      applicationReminders,
      interviewReminders,
      colorTheme,
      accentColor
    });
    
    // Use showToast from useToast hook for the first toast
    showToast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
    
    // Use toast from sonner for the immediate feedback
    toast("Settings updated", {
      description: "Your theme and accent color preferences have been applied",
    });
  };

  const handleThemeChange = (value: string) => {
    setColorTheme(value);
  };
  
  const handleAccentChange = (value: string) => {
    setAccentColor(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your personal information and how your profile appears.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Customize how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="application-reminders">Application Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about follow-ups for applications
              </p>
            </div>
            <Switch
              id="application-reminders"
              checked={applicationReminders}
              onCheckedChange={setApplicationReminders}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="interview-reminders">Interview Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming interviews
              </p>
            </div>
            <Switch
              id="interview-reminders"
              checked={interviewReminders}
              onCheckedChange={setInterviewReminders}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={colorTheme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <Select value={accentColor} onValueChange={handleAccentChange}>
              <SelectTrigger id="accent-color">
                <SelectValue placeholder="Select accent color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <div className={`w-6 h-6 rounded-full bg-primary ${accentColor === 'purple' ? 'ring-2 ring-foreground' : ''}`} />
              <div className={`w-6 h-6 rounded-full bg-blue-500 ${accentColor === 'blue' ? 'ring-2 ring-foreground' : ''}`} />
              <div className={`w-6 h-6 rounded-full bg-green-500 ${accentColor === 'green' ? 'ring-2 ring-foreground' : ''}`} />
              <div className={`w-6 h-6 rounded-full bg-orange-500 ${accentColor === 'orange' ? 'ring-2 ring-foreground' : ''}`} />
              <div className={`w-6 h-6 rounded-full bg-pink-500 ${accentColor === 'pink' ? 'ring-2 ring-foreground' : ''}`} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saveDisabled}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsForm;
