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
  FileText
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
        title: "Profile",
        href: "/profile",
        icon: User,
      },
    ]
  },
];

export function Sidebar({ onClose }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/sign-in");
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <NavLink key={item.href} to={item.href}>
        <div
          className={cn(
            "flex items-center text-sm font-normal rounded-lg cursor-pointer",
            isActive
              ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
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
        <h1 className="text-xl font-bold tracking-tight text-stone-900">
          HAPPY HANGER
        </h1>
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
          {navItems.map((group, index) => (
            <div key={index} className="space-y-1">
              {group.group && (
                <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 mt-4">
                  {group.group}
                </p>
              )}
              {group.items ? (
                group.items.map(renderNavItem)
              ) : (
                renderNavItem(group)
              )}
            </div>
          ))}
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
