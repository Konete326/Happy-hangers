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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Main Profile Header */}
        <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-stone-800 shadow-2xl">
                <AvatarFallback className="bg-stone-800 text-2xl font-bold text-stone-100 uppercase">
                  {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 bg-stone-100 text-stone-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{user?.name || "Member Name"}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-stone-400">
                <span className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-1.5" />
                  {user?.email}
                </span>
                <span className="flex items-center text-sm bg-stone-800 px-3 py-1 rounded-full text-stone-200 border border-stone-700">
                  <Shield className="w-4 h-4 mr-1.5 text-stone-400" />
                  {user?.role?.toUpperCase() || "STAFF"}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "View Profile" : "Edit Details"}
            </Button>
          </div>

          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-stone-800 rounded-full -mr-32 -mt-32 opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Details */}
          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-100">
              <CardTitle className="text-lg flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-stone-500" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">Full Name</Label>
                <p className="font-medium text-stone-900">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">Email Address</Label>
                <p className="font-medium text-stone-900">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">Account Role</Label>
                <p className="font-medium text-stone-900">{user?.role === "admin" ? "Master Admin" : "Sales Representative"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-stone-500 text-xs uppercase tracking-wider">Member Since</Label>
                <p className="font-medium text-stone-900">May 2026</p>
              </div>
            </CardContent>
          </Card>

          {/* Security / Password */}
          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-100">
              <CardTitle className="text-lg flex items-center">
                <Lock className="w-5 h-5 mr-2 text-stone-500" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                <p className="text-sm text-stone-600 mb-4">
                  Keep your account secure by updating your password regularly.
                </p>
                <Button variant="secondary" className="w-full bg-stone-200 hover:bg-stone-300 text-stone-800">
                  Change Password
                </Button>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Two-Factor Auth</p>
                    <p className="text-xs text-stone-500">Add extra security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-stone-900">Need help with your account?</h3>
            <p className="text-sm text-stone-500">Contact the system administrator for role changes or permission updates.</p>
          </div>
          <Button className="bg-stone-900 hover:bg-stone-800 text-white whitespace-nowrap">
            Contact Support
          </Button>
        </div>

      </div>
    </div>
  );
}
