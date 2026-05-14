import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Package,
  Tags,
  ShoppingCart,
  History,
  AlertTriangle,
  LogOut,
  X,
  PlusCircle,
  FileText,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    group: "INVENTORY",
    items: [
      {
        title: "Products",
        href: "/products",
        icon: Package,
      },
      {
        title: "Categories",
        href: "/categories",
        icon: Tags,
      },
    ]
  },
  {
    group: "SALES & POS",
    items: [
      {
        title: "POS System",
        href: "/pos",
        icon: ShoppingCart,
      },
      {
        title: "Orders History",
        href: "/orders",
        icon: History,
      },
    ]
  },
  {
    group: "MANAGEMENT",
    items: [
      {
        title: "Stock Alerts",
        href: "/stock-alerts",
        icon: AlertTriangle,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
      },
      {
        title: "Team Management",
        href: "/employees",
        icon: Users,
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User,
      },
    ]
  },
];

export function Sidebar({ onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/sign-in");
  };

  const canViewItem = (item) => {
    if (!user) return false;
    if (user.role === "admin") return true;

    // Staff restrictions
    if (user.role === "employee") {
      // 1. Hide Profile for staff
      if (item.href === "/profile") return false;

      // 2. Permission Map
      const permissionMap = {
        "/products": "inventory",
        "/categories": "inventory",
        "/pos": "pos",
        "/orders": "orders",
        "/stock-alerts": "inventory",
        "/reports": "reports",
        "/employees": "employees"
      };

      const required = permissionMap[item.href];

      // If a route is defined in the map, check if staff has it
      if (required) {
        return user.permissions?.includes(required);
      }

      // Allow Dashboard by default for all staff
      if (item.href === "/") return true;

      return false; // Hide everything else by default
    }
    return false;
  };

  const renderNavItem = (item) => {
    if (!canViewItem(item)) return null;

    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <NavLink key={item.href} to={item.href}>
        <div
          className={cn(
            "flex items-center text-sm font-normal rounded-lg cursor-pointer",
            isActive
              ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50"
              : "px-3 py-2 text-stone-700 hover:bg-stone-100 transition-colors duration-200 border border-transparent",
          )}
        >
          <Icon className="mr-3 w-4 h-4" />
          {item.title}
        </div>
      </NavLink>
    );
  };

  return (
    <aside className="w-60 bg-white lg:bg-transparent flex flex-col relative z-10 h-full border-r border-stone-200 lg:border-0">
      {/* Brand Header */}
      <div className="p-6 pb-0 relative z-10 flex items-center justify-between font-outfit">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-stone-100 overflow-hidden bg-stone-50 shrink-0 shadow-sm transition-transform hover:scale-105 duration-300">
            <img
              src={user?.brandLogo || "/logo.png"}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-base font-bold tracking-tight text-stone-900 uppercase truncate max-w-[140px]">
            {user?.brandName || "HAPPY HANGER"}
          </h1>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
        <div className="space-y-1">
          {navItems.map((group, index) => {
            const visibleItems = group.items ? group.items.filter(canViewItem) : [group].filter(canViewItem);
            if (visibleItems.length === 0) return null;

            return (
              <div key={index} className="space-y-1">
                {group.group && (
                  <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 mt-4">
                    {group.group}
                  </p>
                )}
                {visibleItems.map(renderNavItem)}
              </div>
            );
          })}
        </div>

        {/* Logout Section */}
        <div className="mt-auto pt-4 border-t border-stone-200">
          <div
            onClick={handleLogout}
            className="flex items-center text-sm font-normal rounded-lg cursor-pointer px-3 py-2 text-stone-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
          >
            <LogOut className="mr-3 w-4 h-4" />
            Logout
          </div>
        </div>
      </nav>
    </aside>
  );
}
