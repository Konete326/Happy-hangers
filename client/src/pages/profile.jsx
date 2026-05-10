import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User as UserIcon,
  Mail,
  Shield,
  Edit,
  Camera,
  Lock,
  Save,
  X,
  Store
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    brandName: user?.brandName || "Happy Hanger",
    brandLogo: user?.brandLogo || ""
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

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/update-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

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

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Main Profile Header */}
        <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-stone-800 shadow-2xl overflow-hidden">
                {formData.brandLogo ? (
                  <AvatarImage src={formData.brandLogo} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-stone-800 text-2xl font-bold text-stone-100 uppercase">
                    {formData.brandName?.[0] || user?.name?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="absolute bottom-0 right-0 p-2 bg-stone-100 text-stone-900 rounded-full shadow-lg cursor-pointer hover:bg-stone-200 transition-all transform hover:scale-110">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
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
                    <p className="text-[10px] text-stone-500 italic">This name will appear on all printed receipts and at the top of the panel.</p>
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
                <p className="text-xs text-stone-500">Last updated recently</p>
              </div>
              <Button variant="outline" className="border-stone-300">Update Password</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
