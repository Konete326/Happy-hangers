import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { Package, AlertTriangle, ShoppingCart, Banknote, TrendingUp, XCircle, Receipt } from "lucide-react";
import { format } from "date-fns";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                <p className="font-bold text-stone-700 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="text-stone-600">Rs. {p.value.toLocaleString()}</p>
                ))}
            </div>
        );
    }
    return null;
};

export function DashboardStats({ data }) {
    const { stats, last7Days, last6Months, lowStockItems, recentOrders } = data;

    const kpiCards = [
        { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        { label: "Today's Revenue", value: `Rs. ${stats.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
        { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
        { label: "Total Products", value: stats.totalProducts, icon: Package, color: "text-stone-700", bg: "bg-stone-100", border: "border-stone-200" },
        { label: "Low Stock Items", value: stats.lowStockProducts, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
        { label: "Out of Stock", value: stats.outOfStockProducts, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    ];

    const pieData = [
        { name: "Healthy", value: Math.max(0, stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts) },
        { name: "Low Stock", value: stats.lowStockProducts || 0 },
        { name: "Out of Stock", value: stats.outOfStockProducts || 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className={`border shadow-sm bg-white ${kpi.border}`}>
                        <CardContent className="p-5">
                            <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div className="text-xl font-black text-stone-900 leading-tight">{kpi.value}</div>
                            <div className="text-xs text-stone-500 mt-1 font-medium">{kpi.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="pb-2 border-b border-stone-100">
                        <CardTitle className="text-sm font-bold text-stone-900">Revenue — Last 7 Days</CardTitle>
                        <p className="text-xs text-stone-400">Daily sales breakdown</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div style={{ width: "100%", height: 230 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7Days} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="pb-2 border-b border-stone-100">
                        <CardTitle className="text-sm font-bold text-stone-900">Monthly Revenue — Last 6 Months</CardTitle>
                        <p className="text-xs text-stone-400">Month-over-month comparison</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div style={{ width: "100%", height: 230 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={last6Months} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" fill="#1c1917" radius={[5, 5, 0, 0]} maxBarSize={44} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="pb-2 border-b border-stone-100">
                        <CardTitle className="text-sm font-bold text-stone-900">Stock Status</CardTitle>
                        <p className="text-xs text-stone-400">Inventory health overview</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div style={{ width: "100%", height: 190 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, name) => [v, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {pieData.map((entry, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                    <span className="text-[11px] text-stone-500">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="pb-2 border-b border-stone-100">
                        <CardTitle className="text-sm font-bold text-stone-900">Low Stock Alert</CardTitle>
                        <p className="text-xs text-stone-400">Products needing restock</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {lowStockItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                                <Package className="w-8 h-8 opacity-30 mb-2" />
                                <p className="text-xs">All products well stocked!</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {lowStockItems.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${p.stock === 0 ? "bg-red-500" : "bg-amber-400"}`} />
                                            <span className="text-sm font-medium text-stone-700 truncate">{p.name}</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${p.stock === 0 ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                                            {p.stock} left
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="pb-2 border-b border-stone-100">
                        <CardTitle className="text-sm font-bold text-stone-900">Recent Orders</CardTitle>
                        <p className="text-xs text-stone-400">Latest 5 transactions</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                                <Receipt className="w-8 h-8 opacity-30 mb-2" />
                                <p className="text-xs">No orders yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {recentOrders.map((o, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                                                <Receipt className="w-3.5 h-3.5 text-stone-500" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black font-mono text-stone-800">#{o._id.slice(-6).toUpperCase()}</div>
                                                <div className="text-[10px] text-stone-400">{format(new Date(o.createdAt), "dd MMM, hh:mm a")}</div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-stone-900">Rs. {o.grandTotal.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
