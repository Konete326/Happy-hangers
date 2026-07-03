import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Search, Eye, Printer, Receipt, Calendar, CreditCard, Banknote, Package } from "lucide-react";
import API from "@/api/api";
import { format } from "date-fns";

import { useAuth } from "@/context/AuthContext";
export default function Orders() {
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedCashier, setSelectedCashier] = useState("all");

    const fetchOrders = async () => {
        try {
            const response = await API.get("/orders");
            setOrders(response.data.data);

            // Also fetch employees for filtering if admin
            if (currentUser?.role === "admin") {
                const empResponse = await API.get("/employees");
                setEmployees(empResponse.data.data);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load order history.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Auto-open receipt if order ID is in URL
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const orderIdToOpen = query.get("openReceipt");
        if (orderIdToOpen && orders.length > 0) {
            const order = orders.find(o => o._id === orderIdToOpen);
            if (order) {
                setSelectedOrder(order);
                setIsReceiptModalOpen(true);
            }
        }
    }, [location.search, orders]);

    const today = new Date().setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(o => new Date(o.createdAt).setHours(0, 0, 0, 0) === today);
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCashier = selectedCashier === "all" || order.cashier?._id === selectedCashier;

        return matchesSearch && matchesCashier;
    });

    const handleViewReceipt = (order) => {
        setSelectedOrder(order);
        setIsReceiptModalOpen(true);
    };

    const handlePrintReceipt = () => {
        if (!selectedOrder) return;
        const printWindow = window.open("", "", "width=400,height=600");
        if (!printWindow) return;

        const itemsHtml = selectedOrder.items.map(item => {
            const sku = item.sku || (item.product && item.product.sku);
            return `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name bold">${item.name}</div>
                        ${sku ? `<div class="item-sku">sku : ${sku}</div>` : ""}
                        <div class="item-qty">${item.qty} x Rs. ${item.price.toLocaleString()}</div>
                    </div>
                    <div class="item-total bold">Rs.${(item.price * item.qty).toLocaleString()}</div>
                </div>`;
        }).join("");

        const cashLines = selectedOrder.paymentMethod === "Cash"
            ? `<div class="summary-line"><span>TENDERED:</span><span>Rs. ${selectedOrder.amountRendered.toLocaleString()}</span></div>
               <div class="summary-line"><span>CHANGE:</span><span>Rs. ${selectedOrder.changeReturned.toLocaleString()}</span></div>`
            : "";

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Order Receipt - ${selectedOrder._id}</title>
                    <meta charset="UTF-8">
                    <style>
                        @page { 
                            size: 80mm auto;
                            margin: 0; 
                        }
                        * { box-sizing: border-box; }
                        body { 
                            width: 72mm; 
                            margin: 0; 
                            padding: 4mm 0; 
                            font-family: 'Courier New', Courier, monospace; 
                            font-size: 11px; 
                            line-height: 1.1; 
                            color: #000; 
                            background: #fff;
                        }
                        .container { width: 100%; padding: 0 1mm; }
                        .center { text-align: center; }
                        .bold { font-weight: 900; }
                        .store-name { 
                            font-size: 16px; 
                            margin-bottom: 2px; 
                        }
                        .divider { 
                            border-bottom: 1px dashed #000; 
                            margin: 6px 0; 
                            width: 100%;
                        }
                        .item { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 4px; 
                            align-items: flex-start;
                        }
                        .item-info { flex: 1; padding-right: 2mm; }
                        .item-name { 
                            font-weight: bold; 
                            text-transform: uppercase; 
                            font-size: 10px;
                            word-wrap: break-word;
                        }
                        .item-total { font-weight: bold; font-size: 11px; white-space: nowrap; }
                        
                        .summary-line { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 2px; 
                            font-size: 10px; 
                        }
                        .total-row { 
                            display: flex; 
                            justify-content: space-between; 
                            font-size: 14px; 
                            font-weight: 900; 
                            margin-top: 4px; 
                            padding-top: 4px; 
                            border-top: 1px solid #000; 
                        }
                        .footer { 
                            font-size: 9px; 
                            margin-top: 12px; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="center">
                            <div class="store-name bold">${currentUser?.brandName?.toUpperCase() || "HAPPY HANGERS"}</div>
                            <div style="font-size: 9px;">Contact: ${currentUser?.phoneNumber || "03XX-XXXXXXX"}</div>
                        </div>
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>ORDER:</span><span class="bold">#${selectedOrder._id.slice(-8).toUpperCase()}</span></div>
                        <div class="summary-line"><span>DATE:</span><span>${format(new Date(selectedOrder.createdAt), "dd/MM/yy HH:mm")}</span></div>
                        
                        <div class="divider"></div>
                        ${itemsHtml}
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>SUBTOTAL:</span><span>Rs. ${selectedOrder.subtotal.toLocaleString()}</span></div>
                        <div class="summary-line"><span>DISCOUNT:</span><span>-Rs. ${selectedOrder.discount?.toLocaleString() || 0}</span></div>
                        <div class="summary-line"><span>TAX (0%):</span><span>Rs. ${selectedOrder.tax.toLocaleString()}</span></div>
                        <div class="total-row"><span>TOTAL:</span><span>Rs. ${selectedOrder.grandTotal.toLocaleString()}</span></div>
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>PAYMENT:</span><span class="bold">${selectedOrder.paymentMethod.toUpperCase()}</span></div>
                        ${cashLines}
                        
                        <div class="divider"></div>
                        <div class="center footer">
                            <div class="bold">THANK YOU FOR SHOPPING!</div>
                            <div style="margin-top: 4px;">Exchange within 7 days with original receipt.</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                            setTimeout(function() { window.close(); }, 1500);
                        };
                    </script>
                </body>
            </html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintReport = () => {
        const printWindow = window.open("", "", "width=800,height=600");
        if (!printWindow) return;

        const rowsHtml = filteredOrders.map(order => `
            <tr>
                <td>#${order._id.slice(-6).toUpperCase()}</td>
                <td>${format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}</td>
                <td>${order.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                <td>${order.paymentMethod}</td>
                <td class="amount">Rs. ${order.grandTotal.toLocaleString()}</td>
            </tr>`).join("");

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Sales Report</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
                        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
                        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                        .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; background: #fafafa; }
                        .card-title { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
                        .card-value { font-size: 24px; font-weight: bold; color: #111; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
                        th { background-color: #f5f5f5; font-weight: bold; }
                        .amount { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Happy Hangers - Sales Report</h1>
                    <p style="margin-top:-20px;margin-bottom:30px;color:#666;">Generated on: ${format(new Date(), "dd MMMM yyyy, hh:mm a")}</p>
                    <div class="summary">
                        <div class="card">
                            <div class="card-title">Lifetime Orders</div>
                            <div class="card-value">${orders.length}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Today's Orders</div>
                            <div class="card-value">${todaysOrders.length}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Today's Revenue</div>
                            <div class="card-value">Rs. ${todaysRevenue.toLocaleString()}</div>
                        </div>
                    </div>
                    <h2>Transaction History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date & Time</th>
                                <th>Items</th>
                                <th>Payment</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-stone-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Orders</CardTitle>
                        <Receipt className="h-4 w-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-stone-900">{orders.length}</div>
                        <p className="text-xs text-stone-500 mt-1">Lifetime total orders</p>
                    </CardContent>
                </Card>
                <Card className="border-stone-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Today's Revenue</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">Rs. {todaysRevenue.toLocaleString()}</div>
                        <p className="text-xs text-stone-500 mt-1">From {todaysOrders.length} orders today</p>
                    </CardContent>
                </Card>
                <Card className="border-stone-200 shadow-sm bg-gradient-to-br from-stone-900 to-stone-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-300">Quick Actions</CardTitle>
                        <Printer className="h-4 w-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full mt-2 bg-white text-stone-900 hover:bg-stone-100" onClick={handlePrintReport}>
                            Export Page Report
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-stone-200 shadow-sm bg-white">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-6 border-b border-stone-100">
                    <div>
                        <CardTitle className="text-xl font-bold text-stone-900">Transaction History</CardTitle>
                        <CardDescription>View and manage all past point-of-sale transactions.</CardDescription>
                    </div>
                    <div className="grid grid-cols-12 gap-4 w-full md:w-auto">
                        <div className="col-span-12 md:col-span-8 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                                placeholder="Search Order ID or Payment..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-stone-50/50 border-stone-200 w-full"
                            />
                        </div>

                        {currentUser?.role === "admin" && (
                            <div className="col-span-12 md:col-span-4">
                                <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                                    <SelectTrigger className="bg-stone-50/50 border-stone-200 w-full">
                                        <SelectValue placeholder="All Cashiers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cashiers</SelectItem>
                                        {employees.map(emp => (
                                            <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-stone-50">
                            <TableRow>
                                <TableHead className="font-bold text-stone-900 pl-6">Order ID</TableHead>
                                <TableHead className="font-bold text-stone-900">Date & Time</TableHead>
                                <TableHead className="font-bold text-stone-900">Sold By</TableHead>
                                <TableHead className="font-bold text-stone-900">Items</TableHead>
                                <TableHead className="font-bold text-stone-900">Payment</TableHead>
                                <TableHead className="font-bold text-stone-900">Total</TableHead>
                                <TableHead className="text-right font-bold text-stone-900 pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                                            <span className="text-sm text-stone-500">Loading transactions...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-stone-500">
                                            <Receipt className="w-10 h-10 mb-2 opacity-20" />
                                            <p>No orders found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order._id} className="hover:bg-stone-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <span className="font-mono text-sm font-bold text-stone-900">
                                                {order.invoiceNo || `#${order._id.slice(-6).toUpperCase()}`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-stone-600 text-sm">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600 border border-stone-200 shrink-0 capitalize">
                                                    {(order.cashier?.name || "AD").charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-stone-900">{order.cashier?.name || "Admin"}</span>
                                                    <span className="text-[10px] text-stone-500 font-medium lowercase tracking-tighter truncate max-w-[80px]">{order.cashier?.email?.split('@')[0] || 'master'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-stone-900 font-medium">
                                                <Package className="w-4 h-4 mr-1.5 text-stone-400" />
                                                {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${order.paymentMethod === "Card" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                                                {order.paymentMethod === "Card" ? <CreditCard className="w-3 h-3 mr-1" /> : <Banknote className="w-3 h-3 mr-1" />}
                                                {order.paymentMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-stone-900">Rs. {order.grandTotal.toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(order)} className="text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Receipt
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-6">
                            <span>Order Receipt</span>
                            {selectedOrder && <span className="font-mono text-sm text-stone-500 bg-stone-100 px-2 py-1 rounded">{selectedOrder.invoiceNo || `#${selectedOrder._id.slice(-6).toUpperCase()}`}</span>}
                        </DialogTitle>
                        <DialogDescription>Complete breakdown of this transaction.</DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 mt-2 space-y-4 font-mono text-sm max-h-[70vh] flex flex-col overflow-hidden">
                            <div className="text-center pb-4 border-b border-stone-200 border-dashed shrink-0 flex flex-col items-center">
                                {currentUser?.logo && <img src={currentUser.logo} alt="Logo" className="h-8 mb-2 object-contain" />}
                                <h3 className="font-bold text-lg text-stone-900 tracking-widest uppercase">{currentUser?.brandName || "HAPPY HANGERS"}</h3>
                                <p className="text-stone-500 text-[10px] mt-1 italic">{format(new Date(selectedOrder.createdAt), "dd MMMM yyyy, hh:mm a")}</p>
                            </div>

                            {/* SCROLLABLE ITEMS AREA */}
                            <div className="space-y-4 py-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                {selectedOrder.items.map((item, idx) => {
                                    const sku = item.sku || (item.product && item.product.sku);
                                    return (
                                        <div key={idx} className="flex justify-between items-start border-b border-stone-100 pb-2 last:border-0">
                                            <div className="flex-1">
                                                <div className="font-bold text-stone-900 uppercase text-[11px] leading-tight">{item.name}</div>
                                                {sku && <div className="text-stone-400 text-[10px] mt-0.5">SKU: {sku}</div>}
                                                <div className="text-stone-500 text-[10px]">{item.qty} x Rs. {item.price.toLocaleString()}</div>
                                            </div>
                                            <div className="font-bold text-stone-900 ml-4 text-[11px]">Rs. {(item.price * item.qty).toLocaleString()}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-stone-200 border-dashed space-y-2 shrink-0">
                                <div className="flex justify-between text-stone-600 text-[10px] uppercase tracking-wider">
                                    <span>Subtotal</span>
                                    <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-600 text-[10px] uppercase tracking-wider">
                                    <span>Tax</span>
                                    <span>Rs. {selectedOrder.tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-stone-900 pt-2 border-t border-stone-900">
                                    <span>TOTAL</span>
                                    <span>Rs. {selectedOrder.grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-2 border-t border-stone-200 space-y-1 text-[10px] text-stone-400 uppercase tracking-tight shrink-0">
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="font-black text-stone-700">{selectedOrder.paymentMethod}</span>
                                </div>
                                {selectedOrder.paymentMethod === "Cash" && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Tendered:</span>
                                            <span>Rs. {selectedOrder.amountRendered.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Change Returned:</span>
                                            <span className="font-black text-stone-900">Rs. {selectedOrder.changeReturned.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
                        <Button className="bg-stone-900 text-white hover:bg-stone-800" onClick={handlePrintReceipt}>
                            <Printer className="w-4 h-4 mr-2" /> Print Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
