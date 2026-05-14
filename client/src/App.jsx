import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/layout";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";
import About from "@/pages/about";
import License from "@/pages/license";
import Categories from "@/pages/inventory/categories";
import Products from "@/pages/inventory/products";
import POS from "@/pages/sales/pos";
import Orders from "@/pages/sales/orders";
import StockAlerts from "@/pages/management/stock-alerts";
import Reports from "@/pages/sales/reports";
import EmployeeManagement from "@/pages/management/EmployeeManagement";

// Dummy Placeholder Pages
const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
    <div className="p-4 bg-stone-100 rounded-full">
      <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
    </div>
    <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
    <p className="text-stone-500 max-w-md">
      This module is currently under development as per the PRD requirements.
      Coming soon: Full backend integration and robust UI.
    </p>
  </div>
);

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}

function Router() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Inventory Routes */}
      <Route path="/products" element={<ProtectedRoute><Layout title="Products Catalog"><Products /></Layout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Layout title="Categories"><Categories /></Layout></ProtectedRoute>} />

      {/* Sales Routes */}
      <Route path="/pos" element={<ProtectedRoute><Layout title="POS System"><POS /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Layout title="Orders History"><Orders /></Layout></ProtectedRoute>} />

      {/* Management Routes */}
      <Route path="/stock-alerts" element={<ProtectedRoute><Layout title="Stock Alerts"><StockAlerts /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout title="Reports Analysis"><Reports /></Layout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Layout title="Team Management"><EmployeeManagement /></Layout></ProtectedRoute>} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout
              title="Profile"
              description="Manage your account settings and personal information"
            >
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Legacy/Temp Routes if needed */}
      <Route path="/tables" element={<ProtectedRoute><Layout title="Tables"><Tables /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout title="Notifications"><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Layout title="Subscriptions"><Subscriptions /></Layout></ProtectedRoute>} />

      {/* Auth Routes */}
      <Route
        path="/auth/sign-in"
        element={user ? <Navigate to="/" replace /> : <SignIn />}
      />
      <Route
        path="/auth/sign-up"
        element={user ? <Navigate to="/" replace /> : <SignUp />}
      />

      {/* Public Pages with Layout */}
      <Route path="/about" element={<Layout title="About Happy Hanger"><About /></Layout>} />
      <Route path="/license" element={<Layout title="Software License"><License /></Layout>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
