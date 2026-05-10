import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout
            title="Profile"
            description="Manage your account settings and personal information"
          >
            <Profile />
          </Layout>
        }
      />
      <Route
        path="/tables"
        element={
          <Layout
            title="Tables"
            description="Browse and manage data across different views"
          >
            <Tables />
          </Layout>
        }
      />
      <Route
        path="/notifications"
        element={
          <Layout
            title="Notifications"
            description="Stay updated with your latest alerts and messages"
          >
            <Notifications />
          </Layout>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <Layout
            title="Subscriptions"
            description="Manage your billing, plans, and subscription settings"
          >
            <Subscriptions />
          </Layout>
        }
      />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
