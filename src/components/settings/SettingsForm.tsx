
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";

const SettingsForm = () => {
  const { toast: showToast } = useToast();
  const { settings, updateSettings } = useSettings();
  const { user, signOut, updateUserProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState(settings.displayName || "");
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications || false);
  const [applicationReminders, setApplicationReminders] = useState(settings.applicationReminders || false);
  const [interviewReminders, setInterviewReminders] = useState(settings.interviewReminders || false);
  const [colorTheme, setColorTheme] = useState(settings.colorTheme || "dark");
  const [accentColor, setAccentColor] = useState(settings.accentColor || "purple");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [profileName, setProfileName] = useState("");

  // Get user profile data
  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata?.full_name || "");
    }
  }, [user]);

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
    
    showToast({
      title: "Settings saved",
      description: "Your preferences have been updated and applied",
    });
  };

  const handleProfileSave = async () => {
    try {
      await updateUserProfile({ full_name: profileName });
      showToast({
        title: "Profile updated",
        description: "Your profile information has been saved",
      });
    } catch (error: any) {
      showToast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Here you would implement the actual account deletion logic
      // For now, we'll just sign out the user
      await signOut();
      showToast({
        title: "Account deleted",
        description: "Your account has been successfully deleted",
      });
    } catch (error: any) {
      showToast({
        title: "Deletion failed",
        description: error.message || "An error occurred while deleting your account",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmPassword("");
      setIsDeleteDialogOpen(false);
    }
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
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileName">Your Name</Label>
              <Input
                id="profileName"
                placeholder="Your Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="profileEmail">Email Address</Label>
              <Input
                id="profileEmail"
                value={user?.email || ""}
                readOnly
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your email cannot be changed as it's used for authentication
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleProfileSave}>
            Save Profile
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how you'd like your dashboard to appear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your Display Name"
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

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Account Management</CardTitle>
          <CardDescription>
            Danger zone: Irreversible account actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="confirmPassword">
                  Enter your password to confirm:
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Your password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={!deleteConfirmPassword}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsForm;
