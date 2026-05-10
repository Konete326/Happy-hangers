import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/dashboard");
        setDashData(res.data.data);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Live overview of your inventory and sales performance.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
        </div>
      ) : dashData ? (
        <DashboardStats data={dashData} />
      ) : (
        <div className="flex items-center justify-center h-64 text-stone-400">
          <p>No data available.</p>
        </div>
      )}
    </div>
  );
}
