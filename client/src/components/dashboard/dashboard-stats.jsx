import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { Package, AlertTriangle, ShoppingCart, Banknote, TrendingUp, XCircle } from "lucide-react";
import { format } from "date-fns";

export function DashboardStats({ data }) {
    const { stats, last7Days, last6Months, lowStockItems, recentOrders } = data;

    const kpiCards = [
        { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Today's Revenue", value: `Rs. ${stats.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Total Products", value: stats.totalProducts, icon: Package, color: "text-stone-700", bg: "bg-stone-100" },
        { label: "Low Stock Items", value: stats.lowStockProducts, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Out of Stock", value: stats.outOfStockProducts, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    ];

    const PIE_COLORS = ["#f59e0b", "#ef4444", "#22c55e"];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-stone-200 shadow-sm bg-white">
                        <CardContent className="p-5">
                            <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            <div className="text-xl font-black text-stone-900">{kpi.value}</div>
                            <div className="text-xs text-stone-500 mt-1">{kpi.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-stone-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-stone-900">Revenue — Last 7 Days</CardTitle>
                        <p className="text-xs text-stone-500">Daily sales breakdown</p>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={last7Days} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, "Revenue"]} />
                                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-stone-900">Monthly Revenue — Last 6 Months</CardTitle>
                        <p className="text-xs text-stone-500">Month-over-month comparison</p>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={last6Months} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, "Revenue"]} />
                                <Bar dataKey="revenue" fill="#0c0a09" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-stone-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-stone-900">Stock Status</CardTitle>
                        <p className="text-xs text-stone-500">Inventory health overview</p>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Low Stock", value: stats.lowStockProducts || 0 },
                                        { name: "Out of Stock", value: stats.outOfStockProducts || 0 },
                                        { name: "Healthy", value: Math.max(0, stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts) },
                                    ]}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={80}
                                    paddingAngle={4} dataKey="value"
                                >
                                    {[0, 1, 2].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Legend iconType="circle" iconSize={8} />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-stone-900">Low Stock Alert</CardTitle>
                        <p className="text-xs text-stone-500">Products needing restock</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {lowStockItems.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-4">All products are well stocked!</p>
                            ) : lowStockItems.map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-stone-700 truncate max-w-[65%]">{p.name}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                        {p.stock} left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-stone-900">Recent Orders</CardTitle>
                        <p className="text-xs text-stone-500">Latest 5 transactions</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentOrders.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-4">No orders yet.</p>
                            ) : recentOrders.map((o, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-mono font-bold text-stone-800">#{o._id.slice(-6).toUpperCase()}</div>
                                        <div className="text-[10px] text-stone-400">{format(new Date(o.createdAt), "dd MMM, hh:mm a")}</div>
                                    </div>
                                    <span className="text-sm font-black text-stone-900">Rs. {o.grandTotal.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
