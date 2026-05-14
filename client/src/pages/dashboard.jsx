import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState("all");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const url = selectedCashier === "all" ? "/dashboard" : `/dashboard?cashierId=${selectedCashier}`;
      const res = await API.get(url);
      setDashData(res.data.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCashier]);

  useEffect(() => {
    if (user?.role === "admin") {
      API.get("/employees").then(res => setEmployees(res.data.data)).catch(() => { });
    }
  }, [user]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-stone-500">Live overview of your inventory and sales performance.</p>
        </div>

        {user?.role === "admin" && (
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-stone-400" />
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger className="w-[200px] bg-white border-stone-200">
                <SelectValue placeholder="All Sales Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Store Sales</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
