import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import logoImg from "@/assets/logo-removebg-preview.png";
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
import { Search, Eye, Printer, Receipt, Calendar, CreditCard, Banknote, Package, ShoppingCart } from "lucide-react";
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
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!isReceiptModalOpen) {
            setIsPrinting(false);
        }
    }, [isReceiptModalOpen]);

    const triggerPrintAnimation = () => {
        if (isPrinting) return;
        setIsPrinting(true);
        setTimeout(() => {
            handlePrintReceipt();
        }, 1500);
        setTimeout(() => {
            setIsPrinting(false);
        }, 4000);
    };

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
        const isElectron = window.process && window.process.versions && window.process.versions.electron;

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

        const printScript = isElectron ? "" : `
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                            setTimeout(function() { window.close(); }, 1500);
                        };
                    </script>
        `;

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <base href="${window.location.origin}/">
                    <title>Order Receipt - ${selectedOrder._id}</title>
                    <meta charset="UTF-8">
                    <style>
                        @page { 
                            size: 80mm 297mm;
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
                            <img src="${logoImg}" style="max-height: 45px; margin-bottom: 4px; object-fit: contain;" />
                            <div class="store-name bold">HAPPY HANGERS</div>
                            <div style="font-size: 8px; margin-top: 2px; line-height: 1.2; font-weight: bold;">Plot # 1898, FB area Block 14, Near KKF general hospital, Karachi</div>
                            <div style="font-size: 9px; margin-top: 2px;">Happyhangers.com.pk</div>
                            <div style="font-size: 9px;">Contact: 03003733571</div>
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
                        <div class="center footer" style="text-align: left; padding: 0 2mm;">
                            <div class="bold" style="text-align: center; margin-bottom: 6px; font-size: 11px;">THANK YOU FOR SHOPPING!</div>
                            <div style="margin-top: 2px; font-size: 9px;">- No return only exchange</div>
                            <div style="margin-top: 2px; font-size: 9px;">- 3 day exchange policy</div>
                            <div style="margin-top: 2px; font-size: 9px;">- No exchange without receipt</div>
                            <div style="margin-top: 2px; font-size: 9px;">- No exchange on sale items</div>
                            <div style="margin-top: 2px; font-size: 9px;">- No exchange on defected items</div>
                        </div>
                    </div>
                    ${printScript}
                </body>
            </html>`;

        if (isElectron) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('print-receipt', html);
        } else {
            const printWindow = window.open("", "", "width=400,height=600");
            if (!printWindow) return;
            printWindow.document.write(html);
            printWindow.document.close();
        }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                <Card className="border-stone-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Print Report</CardTitle>
                        <Printer className="h-4 w-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full mt-2 border-stone-200 text-stone-700 hover:bg-stone-50" onClick={handlePrintReport}>
                            Print Page Report
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-stone-200 shadow-sm bg-gradient-to-br from-stone-900 to-stone-800 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-300">Quick Actions</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-stone-400" />
                    </CardHeader>
                    <CardContent>
                        <Link to="/">
                            <Button className="w-full mt-2 bg-white text-stone-900 hover:bg-stone-100 font-bold">
                                Create New Sale
                            </Button>
                        </Link>
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
                        <div className={`printer-wrapper ${isPrinting ? 'is-printing' : ''}`}>
                            <style dangerouslySetInnerHTML={{ __html: printerStyles }} />
                            
                            <div className="printer-container" style={{ position: 'relative', width: '320px', height: '80px' }}>
                                <div className="printer">
                                    <div className="printer-display">
                                        {!isPrinting ? (
                                            <span className="printer-message">Click to print</span>
                                        ) : (
                                            <div className="letter-wrapper">
                                                <span className="letter">P</span>
                                                <span className="letter">r</span>
                                                <span className="letter">i</span>
                                                <span className="letter">n</span>
                                                <span className="letter">t</span>
                                                <span className="letter">i</span>
                                                <span className="letter">n</span>
                                                <span className="letter">g</span>
                                                <span className="letter">.</span>
                                                <span className="letter">.</span>
                                                <span className="letter">.</span>
                                            </div>
                                        )}
                                    </div>
                                    <button className="print-button" onClick={triggerPrintAnimation}>🖨</button>
                                </div>

                                <div className="receipt-wrapper">
                                    <div className="receipt">
                                        <div className="receipt-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                            <img src={logoImg} alt="Logo" style={{ maxHeight: '35px', objectFit: 'contain', marginBottom: '4px' }} />
                                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>HAPPY HANGERS</div>
                                            <div style={{ fontSize: '7px', lineHeight: '1.2' }}>Plot # 1898, FB area Block 14, Near KKF general hospital, Karachi</div>
                                            <div style={{ fontSize: '8px', marginTop: '2px' }}>Happyhangers.com.pk</div>
                                            <div style={{ fontSize: '8px' }}>Contact: 03003733571</div>
                                        </div>
                                        
                                        <div className="receipt-subheader" style={{ fontSize: '7px', borderBottom: '1px dashed #ccc', paddingBottom: '4px', marginTop: '4px', textTransform: 'uppercase' }}>
                                            Order: {selectedOrder.invoiceNo || `#${selectedOrder._id.slice(-6).toUpperCase()}`} <br />
                                            Date: {format(new Date(selectedOrder.createdAt), "dd/MM/yy HH:mm")}
                                        </div>

                                        <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginTop: '4px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px dashed #ccc' }}>
                                                    <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                                                    <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ textAlign: 'left', padding: '3px 0', textTransform: 'uppercase', fontSize: '7px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                                        <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.qty} x</td>
                                                        <td style={{ textAlign: 'right', padding: '3px 0' }}>Rs. {item.price.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="receipt-subtotal" style={{ borderTop: '1px dashed #ccc' }}>
                                                    <td colSpan={2} style={{ padding: '4px 0 2px 0' }}>Subtotal</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0 2px 0' }}>Rs. {selectedOrder.subtotal.toLocaleString()}</td>
                                                </tr>
                                                {selectedOrder.discount > 0 && (
                                                    <tr className="receipt-tax">
                                                        <td colSpan={2} style={{ padding: '2px 0' }}>Discount</td>
                                                        <td style={{ textAlign: 'right', padding: '2px 0' }}>-Rs. {selectedOrder.discount.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                <tr className="receipt-tax">
                                                    <td colSpan={2} style={{ padding: '2px 0' }}>Tax</td>
                                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>Rs. {selectedOrder.tax.toLocaleString()}</td>
                                                </tr>
                                                <tr className="receipt-total" style={{ borderTop: '1px dashed #000', fontWeight: 'bold' }}>
                                                    <td colSpan={2} style={{ padding: '4px 0 0 0', fontSize: '9px' }}>Total</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0 0 0', fontSize: '9px' }}>Rs. {selectedOrder.grandTotal.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div className="receipt-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderTop: '1px dashed #ccc', marginTop: '8px', paddingTop: '6px', fontSize: '6px', lineHeight: '1.4' }}>
                                            <div className="bold" style={{ width: '100%', textAlign: 'center', fontSize: '7px', fontWeight: 'bold', marginBottom: '4px' }}>THANK YOU FOR SHOPPING!</div>
                                            <div>- No return only exchange</div>
                                            <div>- 3 day exchange policy</div>
                                            <div>- No exchange without receipt</div>
                                            <div>- No exchange on sale items</div>
                                            <div>- No exchange on defected items</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
                        <Button className="bg-stone-900 text-white hover:bg-stone-800" onClick={triggerPrintAnimation} disabled={isPrinting}>
                            <Printer className="w-4 h-4 mr-2" /> {isPrinting ? "Printing..." : "Print Receipt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const printerStyles = `
  .printer-wrapper {
    --printer-color: #dcdac4;
    --printer-color-2: #c0beaa;
    --receipt-color: #f5f5f5;

    font-size: 14px;
    position: relative;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 440px;
    padding-top: 50px;
    overflow: hidden;
  }

  .printer {
    width: 320px;
    height: 80px;
    border-radius: 0 0 8px 8px;
    position: relative;

    background-color: var(--printer-color);
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2GkpeCalE7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==);
    border: 2px solid var(--printer-color-2);
    box-shadow:
      0 16px 32px 0px #0002,
      0 -30px 16px 0px #0001;
  }

  .printer::before {
    content: "";
    position: absolute;
    top: -30px;
    left: 0;
    width: 100%;
    height: 70px;
    border-radius: 12px 12px 0 0;
    border-bottom: 2px solid #0003;
    box-shadow:
      0 12px 16px -12px #fff5 inset,
      0 -6px 16px -6px #0003 inset,
      0 6px 8px -6px #0004;
    box-sizing: border-box;
    background-color: inherit;
    background-image: inherit;
    filter: brightness(1.12);
    z-index: 2;
  }

  .printer::after {
    content: "";
    position: absolute;
    top: 20px;
    left: 30px;
    width: 260px;
    height: 40px;
    border-radius: 0 0 4px 4px;
    border-bottom: 1px solid #0003;
    background-color: inherit;
    background-image: linear-gradient(
      to top,
      var(--printer-color),
      60%,
      var(--printer-color-2)
    );
    box-shadow: 0 4px 4px -2px #0004;
    z-index: 1;
  }

  .printer-display {
    z-index: 2;
    display: flex;
    padding: 6px 8px;
    position: absolute;
    top: -10px;
    left: 30px;
    width: 160px;
    height: 32px;

    background-color: #000;
    background-image: linear-gradient(transparent 0, #fff2 90%, transparent 100%);
    background-size: 100% 8px;
    background-repeat: no-repeat;
    border: 3px solid var(--printer-color-2);
    border-radius: 6px;
    box-sizing: border-box;
    box-shadow:
      -1px -1px 2px 0 #fff9 inset,
      1px 1px 5px 1px #000 inset,
      0 0 1px 2px #0002;

    font-family: "Courier New", Courier, monospace;
    font-size: 0.8em;
    color: #5aff5a;
    filter: drop-shadow(1px 1px 1px #0002);
  }

  .print-button {
    z-index: 2;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    position: absolute;
    top: -30px;
    right: 0;
    margin: 16px;
    border: 1px solid #0001;
    border-radius: 6px;
    width: 48px;
    height: 36px;
    background-color: var(--printer-color);
    box-shadow:
      1px 1px 2px 0 #fff8 inset,
      -1px -1px 2px 0 #0002 inset,
      0 2px 6px 0px #0002;
    transition:
      box-shadow 0.1s ease-in-out,
      transform 0.1s ease-in-out;
  }

  .print-button:hover {
    box-shadow:
      2px 2px 2px 0 #fff9 inset,
      -2px -2px 2px 0 #0002 inset,
      0 2px 10px 0px #0002;
    transform: scale(1.05);
  }
  .print-button:active {
    box-shadow:
      2px 2px 2px 0 #0002 inset,
      -2px -2px 2px 0 #fff9 inset,
      0 0px 4px 0px #fff9;
    transform: scale(0.95);
  }

  .receipt-wrapper {
    position: absolute;
    top: 0;
    left: 60px;
    filter: drop-shadow(0 0 12px #0001);
    transform: translateY(-100%);
    clip-path: inset(100% -100px -100px -100px);
    transition: clip-path 0.5s;
  }

  .receipt {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 16px;
    width: 200px;
    min-height: 160px;
    font-size: 0.75em;
    font-family: "Azeret Mono", "Roboto Mono", monospace;
    font-weight: 400;
    color: #444;
    background-color: var(--receipt-color);
    box-shadow:
      0 12px 12px 0 #0001,
      0 24px 24px 0 #0001,
      0 36px 36px 0 #0001;
  }

  .receipt::before,
  .receipt::after {
    --angle: 45deg;
    content: "";
    display: block;
    position: absolute;
    left: 0px;
    width: 100%;
    height: 8px;
    background: linear-gradient(
        calc(var(--angle) * -1),
        var(--receipt-color) 4px,
        transparent 0
      ),
      linear-gradient(var(--angle), var(--receipt-color) 4px, transparent 0);
    background-position: 4px 0;
    background-repeat: repeat-x;
    background-size: 8px 8px;
  }
  .receipt::before {
    top: -8px;
    background-position: 4px 0;
  }
  .receipt::after {
    bottom: -8px;
    background-position: 0 100%;
    --angle: 225deg;
  }

  .receipt-header,
  .receipt-subheader,
  .receipt-message {
    display: flex;
    justify-content: space-between;
    padding: 0.2em 0;
  }

  .receipt-header {
    font-size: 1.1em;
    font-weight: 600;
  }
  .receipt-subheader {
    border-bottom: 1px dashed #ccc;
  }
  .receipt-message {
    justify-content: center;
    text-align: center;
    padding: 0 1em;
  }

  .letter-wrapper {
    position: inherit;
    display: flex;
  }

  .letter {
    display: inline-block;
    opacity: 0;
  }

  .printer-wrapper.is-printing .receipt-wrapper {
    animation:
      print-anim 1.2s 1 forwards ease-in,
      display-anim 0.4s 1 forwards cubic-bezier(0, 0.63, 0.96, 1.1);
    animation-delay: 0s, 1.35s;
  }

  .printer-wrapper.is-printing .printer-message {
    opacity: 0;
  }

  .printer-wrapper.is-printing .letter {
    animation: show-text-anim 0.6s 1 forwards linear;
  }

  .printer-wrapper.is-printing .letter:nth-child(1) { animation-delay: 0.05s; }
  .printer-wrapper.is-printing .letter:nth-child(2) { animation-delay: 0.1s; }
  .printer-wrapper.is-printing .letter:nth-child(3) { animation-delay: 0.15s; }
  .printer-wrapper.is-printing .letter:nth-child(4) { animation-delay: 0.2s; }
  .printer-wrapper.is-printing .letter:nth-child(5) { animation-delay: 0.25s; }
  .printer-wrapper.is-printing .letter:nth-child(6) { animation-delay: 0.3s; }
  .printer-wrapper.is-printing .letter:nth-child(7) { animation-delay: 0.35s; }
  .printer-wrapper.is-printing .letter:nth-child(8) { animation-delay: 0.4s; }
  .printer-wrapper.is-printing .letter:nth-child(9) { animation-delay: 0.45s; }
  .printer-wrapper.is-printing .letter:nth-child(10) { animation-delay: 0.5s; }
  .printer-wrapper.is-printing .letter:nth-child(11) { animation-delay: 0.55s; }

  @keyframes print-anim {
    100% {
      transform: translateY(10%);
      clip-path: inset(-20% -100px -100px -100px);
    }
  }

  @keyframes display-anim {
    30% {
      transform: translateY(22%) rotate3d(1, 0, 1, -5deg);
    }
    70% {
      z-index: 5;
    }
    100% {
      z-index: 5;
      transform: translateY(-40%) scale(1.15);
    }
  }

  @keyframes show-text-anim {
    10%, 100% {
      opacity: 1;
    }
  }
`;
