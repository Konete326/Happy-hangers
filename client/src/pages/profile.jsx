import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  KeyRound,
  AlertTriangle
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
    brandName: user?.brandName || "Happy Hangers",
    brandLogo: user?.brandLogo || "",
    phoneNumber: user?.phoneNumber || "+92 300 0000000",
    websiteUrl: user?.websiteUrl || "Happyhangers.com.pk"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Reset Data State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = Selection, 2 = Password
  const [resetScope, setResetScope] = useState("all"); // 'all' or 'custom'
  const [customOptions, setCustomOptions] = useState({
    products: false,
    categories: false,
    orders: false,
    employees: false
  });
  const [adminPassword, setAdminPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

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

  const handleResetData = async (e) => {
    e.preventDefault();
    if (!adminPassword) return;

    setIsResetting(true);
    try {
      let options = { products: true, categories: true, orders: true, employees: true };
      if (resetScope === "custom") {
        options = customOptions;
      }

      const response = await API.post("/system/reset-data", {
        password: adminPassword,
        options
      });

      if (response.data.status === "success") {
        toast({ title: "System Reset Successful", description: "Selected data has been permanently deleted." });
        setIsResetModalOpen(false);
        setAdminPassword("");
        setResetStep(1);
        // Reset local state if customOptions says to (for a full app reload it might be better, but we leave it as is)
        if (options.products || options.categories || options.orders || options.employees) {
            setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || "Invalid password or server error",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Main Profile Header */}
        <div className="bg-stone-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-5">
            <div className="relative group">
              <Avatar
                onClick={handleAvatarClick}
                className="w-16 h-16 border-2 border-stone-800 shadow-xl overflow-hidden cursor-pointer"
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
              <h1 className="text-2xl font-bold">{formData.brandName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-stone-400">
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
                <Button onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || "",
                    brandName: user?.brandName || "Happy Hangers",
                    brandLogo: user?.brandLogo || "",
                    phoneNumber: user?.phoneNumber || "+92 300 0000000",
                    websiteUrl: user?.websiteUrl || "Happyhangers.com.pk"
                  });
                }} variant="ghost" className="text-white hover:bg-white/10">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Details Card */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50 py-3">
              <CardTitle className="text-base flex items-center">
                <Store className="w-4 h-4 mr-2 text-stone-500" />
                Store Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Store/Brand Name</Label>
                    <Input
                      id="brandName"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="e.g. Happy Hangers"
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
                    <Label htmlFor="websiteUrl">Store Website/URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="e.g. Happyhangers.com.pk"
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
                    <p className="font-semibold text-lg text-stone-900">{user?.brandName || "Happy Hangers"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-500 text-xs uppercase tracking-wider">Contact Number (Print on Receipt)</Label>
                    <p className="font-medium text-stone-900">{user?.phoneNumber || "+92 3XX XXXXXXX"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-500 text-xs uppercase tracking-wider">Store Website/URL</Label>
                    <p className="font-medium text-stone-900">{user?.websiteUrl || "Happyhangers.com.pk"}</p>
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
            <CardHeader className="border-b border-stone-100 bg-stone-50/50 py-3">
              <CardTitle className="text-base flex items-center">
                <Mail className="w-4 h-4 mr-2 text-stone-500" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
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
        {/*
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
                disabled={true}
              >
                Update Password (Disabled)
              </Button>
            </div>
          </CardContent>
        </Card>
        */}

        {user?.role === 'admin' && (
          <Card className="border-red-200 shadow-sm relative overflow-hidden bg-red-50/30">
            <CardHeader className="border-b border-red-100 py-3">
              <CardTitle className="text-base flex items-center text-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center justify-between p-3 bg-white rounded-xl border border-red-200 shadow-sm">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <p className="font-semibold text-stone-900">System Data Reset</p>
                  <p className="text-xs text-stone-500 max-w-md">Permanently delete products, categories, orders, and employees. This action is irreversible.</p>
                </div>
                <Button
                  onClick={() => {
                    setResetStep(1);
                    setAdminPassword("");
                    setIsResetModalOpen(true);
                  }}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 font-bold"
                >
                  Reset System Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* System Reset Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          {resetStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Reset System Data
                </DialogTitle>
                <DialogDescription>
                  Select what data you want to permanently delete from the system.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button" 
                    variant={resetScope === "all" ? "default" : "outline"} 
                    className={resetScope === "all" ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : ""}
                    onClick={() => setResetScope("all")}
                  >
                    Reset All Data
                  </Button>
                  <Button 
                    type="button" 
                    variant={resetScope === "custom" ? "default" : "outline"}
                    className={resetScope === "custom" ? "bg-stone-900 text-white" : ""}
                    onClick={() => setResetScope("custom")}
                  >
                    Custom Selection
                  </Button>
                </div>

                {resetScope === "custom" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-stone-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reset-products" 
                        checked={customOptions.products}
                        onCheckedChange={(c) => setCustomOptions(p => ({ ...p, products: c }))}
                      />
                      <label htmlFor="reset-products" className="text-sm font-medium">Products</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reset-categories" 
                        checked={customOptions.categories}
                        onCheckedChange={(c) => setCustomOptions(p => ({ ...p, categories: c }))}
                      />
                      <label htmlFor="reset-categories" className="text-sm font-medium">Categories</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reset-orders" 
                        checked={customOptions.orders}
                        onCheckedChange={(c) => setCustomOptions(p => ({ ...p, orders: c }))}
                      />
                      <label htmlFor="reset-orders" className="text-sm font-medium">Order History & Reports</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reset-employees" 
                        checked={customOptions.employees}
                        onCheckedChange={(c) => setCustomOptions(p => ({ ...p, employees: c }))}
                      />
                      <label htmlFor="reset-employees" className="text-sm font-medium">Team Management (Staff)</label>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => setResetStep(2)} 
                  disabled={resetScope === "custom" && !Object.values(customOptions).some(Boolean)}
                >
                  Next Step
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleResetData}>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <Lock className="w-5 h-5 mr-2" />
                  Admin Verification
                </DialogTitle>
                <DialogDescription>
                  Please enter your admin password to confirm deletion. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center w-full">
                <Button type="button" variant="ghost" onClick={() => setResetStep(1)}>Back</Button>
                <Button type="submit" disabled={isResetting || !adminPassword} variant="destructive" className="bg-red-600 hover:bg-red-700">
                  {isResetting ? "Deleting..." : "Confirm & Reset"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
