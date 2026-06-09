import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from "recharts";
import {
    TrendingUp,
    Calendar,
    Package,
    DollarSign,
    CreditCard,
    Banknote,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import API from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { format, subDays, startOfToday } from "date-fns";

const COLORS = ["#000000", "#4b5563", "#9ca3af", "#d1d5db", "#f3f4f6"];

export default function Reports() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7days");

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/reports/sales?range=${dateRange}`);
            setData(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load reports.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const handleExportPDF = () => {
        if (!data) return;
        const printWindow = window.open("", "", "width=800,height=1000");
        if (!printWindow) return;

        const topProductsHtml = data.topProducts.map(p => `
            <tr>
                <td>${p.name} <br><small>${p.sku}</small></td>
                <td>${p.totalQty} Units</td>
                <td class="amount">Rs. ${p.totalRevenue.toLocaleString()}</td>
            </tr>
        `).join("");

        const categoriesHtml = data.categorySales.map(c => `
            <tr>
                <td>${c._id}</td>
                <td>${c.qty} Items</td>
                <td class="amount">Rs. ${c.revenue.toLocaleString()}</td>
            </tr>
        `).join("");

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Sales Performance Report - ${user?.brandName || "Happy Hanger"}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
                        .header { border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .logo-area h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
                        .info-area { text-align: right; font-size: 12px; color: #666; }
                        .report-title { font-size: 24px; font-weight: 800; margin-bottom: 30px; text-transform: uppercase; border-left: 10px solid #000; padding-left: 15px; }
                        .stats-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; }
                        .stat-label { font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                        .stat-value { font-size: 20px; font-weight: 900; color: #111; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { text-align: left; background: #000; color: #fff; padding: 12px 15px; font-size: 12px; text-transform: uppercase; }
                        td { padding: 12px 15px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .amount { font-weight: 800; text-align: right; }
                        .section-head { font-size: 16px; font-weight: 900; margin: 30px 0 15px 0; display: flex; align-items: center; gap: 10px; }
                        .section-head::after { content: ""; flex: 1; height: 1px; background: #eee; }
                        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #9ca3af; }
                        @media print { body { padding: 0; } .stat-card { background: #f9fafb !important; -webkit-print-color-adjust: exact; } th { background: #000 !important; color: #fff !important; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-area">
                            <h1>${(user?.brandName || "HAPPY HANGER").toUpperCase()}</h1>
                            <div style="font-size: 12px; font-weight: 600; color: #666;">INVENTORY & POS SYSTEM</div>
                        </div>
                        <div class="info-area">
                            <div>Generated: ${format(new Date(), "PPpp")}</div>
                            <div>Range: ${dateRange.toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="report-title">Sales Performance Analysis</div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Net Sales Revenue</div>
                            <div class="stat-value">Rs. ${data.summary.totalRevenue.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Total Transactions</div>
                            <div class="stat-value">${data.summary.totalOrders} Units</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Average Order Value</div>
                            <div class="stat-value">Rs. ${Math.round(data.summary.avgOrderValue).toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="section-head">Product Performance</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th>Quantity Sold</th>
                                <th style="text-align: right;">Revenue contribution</th>
                            </tr>
                        </thead>
                        <tbody>${topProductsHtml}</tbody>
                    </table>

                    <div class="section-head">Category Contribution</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Volume</th>
                                <th style="text-align: right;">Revenue Share</th>
                            </tr>
                        </thead>
                        <tbody>${categoriesHtml}</tbody>
                    </table>

                    <div class="section-head">Payment Method Distribution</div>
                    <div style="display: flex; gap: 40px; padding: 10px;">
                        ${data.paymentStats.map(s => `
                            <div>
                                <div class="stat-label">${s._id} Volume</div>
                                <div style="font-weight: 800; font-size: 16px;">Rs. ${s.revenue.toLocaleString()}</div>
                                <div style="font-size: 10px; color: #666;">${s.count} Transactions</div>
                            </div>
                        `).join("")}
                    </div>

                    <div class="footer">
                        ${user?.brandName || "Happy Hanger"} POS System • Internal Business Document • Page 1 of 1
                    </div>

                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (loading && !data) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                <p className="text-stone-500 font-medium">Analyzing Sales Performance...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900">Performance Reports</h1>
                    <p className="text-sm text-stone-500">In-depth analysis of your sales and inventory trends.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px] bg-white h-11 border-stone-200">
                            <Calendar className="w-4 h-4 mr-2 text-stone-400" />
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-11 border-stone-200 bg-white" onClick={handleExportPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden relative group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Net Revenue</p>
                            <div className="p-2 bg-stone-100 rounded-lg"><DollarSign className="w-4 h-4 text-stone-600" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-stone-900 mt-2">Rs. {data?.summary?.totalRevenue?.toLocaleString() || 0}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                            <TrendingUp className="w-3 h-3" /> Growth Tracking Active
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden relative group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Order Count</p>
                            <div className="p-2 bg-stone-100 rounded-lg"><Package className="w-4 h-4 text-stone-600" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-stone-900 mt-2">{data?.summary?.totalOrders || 0}</h3>
                        <p className="text-[10px] text-stone-400 font-medium mt-1">Completed Transactions</p>
                    </CardContent>
                </Card>
                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden relative group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Avg. Order</p>
                            <div className="p-2 bg-stone-100 rounded-lg"><ArrowUpRight className="w-4 h-4 text-stone-600" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-stone-900 mt-2">Rs. {Math.round(data?.summary?.avgOrderValue || 0).toLocaleString()}</h3>
                        <p className="text-[10px] text-stone-400 font-medium mt-1">Revenue per Customer</p>
                    </CardContent>
                </Card>
                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden relative group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Payment Mix</p>
                            <div className="p-2 bg-stone-100 rounded-lg"><CreditCard className="w-4 h-4 text-stone-600" /></div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            {data?.paymentStats?.map((s, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-lg font-black text-stone-900">{s.count}</span>
                                    <span className="text-[10px] uppercase text-stone-400">{s._id}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-stone-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-stone-50">
                        <div>
                            <CardTitle className="text-lg font-black text-stone-900">Revenue Timeline</CardTitle>
                            <CardDescription className="text-xs">Daily performance monitoring</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 h-fit py-1 px-2 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                            Live Aggregation
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.timeline}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="_id"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                                        formatter={(val) => format(new Date(val), "dd MMM")}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                        labelFormatter={(val) => format(new Date(val), "dd MMMM yyyy")}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-stone-50">
                        <CardTitle className="text-lg font-black text-stone-900">Category Mix</CardTitle>
                        <CardDescription className="text-xs">Revenue share by products</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.categorySales}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                        nameKey="_id"
                                    >
                                        {data?.categorySales?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-stone-400 font-bold uppercase">Volume</span>
                                <span className="text-xl font-black text-stone-900">
                                    {data?.categorySales?.reduce((acc, c) => acc + c.qty, 0)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            {data?.categorySales?.slice(0, 4).map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-xs font-bold text-stone-600 line-clamp-1">{c._id}</span>
                                    </div>
                                    <span className="text-xs font-black text-stone-900">Rs. {c.revenue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-stone-50 pb-4">
                        <CardTitle className="text-lg font-black text-stone-900">Top Performing Products</CardTitle>
                        <CardDescription className="text-xs">Ranked by revenue contribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-stone-50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold uppercase text-stone-400 pl-6">Product</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-stone-400">Qty Sold</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-stone-400 text-right pr-6">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.topProducts?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-stone-400 italic">No sales data recorded.</TableCell>
                                    </TableRow>
                                ) : (
                                    data?.topProducts?.map((p, i) => (
                                        <TableRow key={i} className="hover:bg-stone-50/50">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-stone-900 line-clamp-1 text-sm">{p.name}</span>
                                                    <span className="text-[10px] font-mono text-stone-400">{p.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-stone-700">{p.totalQty} Units</TableCell>
                                            <TableCell className="text-right pr-6 font-black text-stone-900">Rs. {p.totalRevenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-stone-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-stone-50">
                        <CardTitle className="text-lg font-black text-stone-900">Payment Breakdown</CardTitle>
                        <CardDescription className="text-xs">Transaction method distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.paymentStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="_id"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 'bold', fill: '#111' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="revenue" fill="#000" radius={[0, 4, 4, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-4">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Banknote className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cash Volume</p>
                                    <p className="text-lg font-black text-stone-900">
                                        Rs. {data?.paymentStats?.find(p => p._id === "Cash")?.revenue?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-4">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Card Volume</p>
                                    <p className="text-lg font-black text-stone-900">
                                        Rs. {data?.paymentStats?.find(p => p._id === "Card")?.revenue?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
