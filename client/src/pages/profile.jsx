import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  User as UserIcon,
  Mail,
  Shield,
  Edit,
  Camera,
  Lock,
  Save,
  X,
  Store,
  Eye,
  KeyRound
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    brandName: user?.brandName || "Happy Hanger",
    brandLogo: user?.brandLogo || "",
    phoneNumber: user?.phoneNumber || "+92 300 0000000"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image must be under 2MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, brandLogo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    } else {
      setIsPreviewOpen(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await API.patch("/auth/update-profile", formData);

      if (response.data.status === "success") {
        updateUser(response.data.data.user);
        toast({ title: "Profile Updated", description: "Your brand identity has been saved successfully." });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await API.patch("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.status === "success") {
        toast({ title: "Success", description: "Password updated successfully." });
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Invalid current password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Main Profile Header */}
        <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative group">
              <Avatar
                onClick={handleAvatarClick}
                className="w-24 h-24 border-4 border-stone-800 shadow-2xl overflow-hidden cursor-pointer"
              >
                {formData.brandLogo ? (
                  <AvatarImage src={formData.brandLogo} className="object-cover" />
                ) : (
                  <AvatarImage src="/logo.png" className="object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? <Camera className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </div>
              </Avatar>

              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-stone-100 text-stone-900 rounded-full shadow-lg cursor-pointer hover:bg-stone-200 transition-all transform hover:scale-110">
                  <Camera className="w-4 h-4" />
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{formData.brandName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-stone-400">
                <span className="flex items-center text-sm">
                  <UserIcon className="w-4 h-4 mr-1.5" />
                  {formData.name}
                </span>
                <span className="flex items-center text-sm bg-stone-800 px-3 py-1 rounded-full text-stone-200 border border-stone-700">
                  <Shield className="w-4 h-4 mr-1.5 text-stone-400" />
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Brand Identity
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-white hover:bg-white/10">
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting} className="bg-stone-100 text-stone-900 hover:bg-stone-200">
                  {isSubmitting ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-stone-800 rounded-full -mr-32 -mt-32 opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand Details Card */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg flex items-center">
                <Store className="w-5 h-5 mr-2 text-stone-500" />
                Store Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Store/Brand Name</Label>
                    <Input
                      id="brandName"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="e.g. Happy Hanger"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Contact Number (Print on Receipt)</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+92 3XX XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Owner Name</Label>
                    <Input
                      id="userName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Full Name"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-stone-500 text-xs uppercase tracking-wider">Display Brand Name</Label>
                    <p className="font-semibold text-lg text-stone-900">{user?.brandName || "Happy Hanger"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-500 text-xs uppercase tracking-wider">Contact Number (Print on Receipt)</Label>
                    <p className="font-medium text-stone-900">{user?.phoneNumber || "+92 3XX XXXXXXX"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-500 text-xs uppercase tracking-wider">Admin/Owner Name</Label>
                    <p className="font-medium text-stone-900">{user?.name}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg flex items-center">
                <Mail className="w-5 h-5 mr-2 text-stone-500" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">Login Email</Label>
                <p className="font-medium text-stone-900">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">System Role</Label>
                <p className="font-medium text-stone-900 prose-sm">{user?.role === "admin" ? "Full Access Administrator" : "Limited Access Staff"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security / Password */}
        <Card className="border-stone-200 shadow-sm relative overflow-hidden">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg flex items-center">
              <Lock className="w-5 h-5 mr-2 text-stone-500" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="font-semibold text-stone-900">Change Account Password</p>
                <p className="text-xs text-stone-500">Keep your access secure</p>
              </div>
              <Button
                onClick={() => setIsPasswordModalOpen(true)}
                variant="outline"
                className="border-stone-300 hover:bg-stone-900 hover:text-white transition-all"
              >
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Brand Logo Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Logo Preview</DialogTitle>
            <DialogDescription>Full size preview of your brand logo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-8 border border-stone-100">
              {formData.brandLogo ? (
                <img src={formData.brandLogo} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-stone-300 text-8xl font-black">{formData.brandName?.[0]}</div>
              )}
            </div>
            <Button onClick={() => setIsPreviewOpen(false)} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md">
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeyRound className="w-5 h-5 mr-2 text-stone-600" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Ensure your new password contains at least 8 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                value={passwordData.newPassword}

                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}

              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-stone-900 text-white hover:bg-stone-800">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
