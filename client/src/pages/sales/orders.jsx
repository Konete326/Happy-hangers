import { useState, useEffect } from "react";
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
import axios from "axios";
import { format } from "date-fns";

export default function Orders() {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load order history.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Derived stats
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(o => new Date(o.createdAt).setHours(0, 0, 0, 0) === today);
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewReceipt = (order) => {
        setSelectedOrder(order);
        setIsReceiptModalOpen(true);
    };

    const handlePrintReceipt = () => {
        if (!selectedOrder) return;
        const printWindow = window.open('', '', 'width=400,height=600');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Receipt - ${selectedOrder._id}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; text-align: left; margin: 0; padding: 20px; font-size: 12px; }
                        h2 { text-align: center; margin-bottom: 5px; }
                        p { text-align: center; margin-top: 0; color: #555; }
                        .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .item-name { max-width: 60%; }
                        .totals { margin-top: 15px; }
                        .totals div { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <h2>HAPPY HANGER</h2>
                    <p>Receipt #${selectedOrder._id.slice(-6).toUpperCase()}</p>
                    <p>Date: ${format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                    
                    <div class="divider"></div>
                    
                    ${selectedOrder.items.map(item => `
                        <div class="item">
                            <span class="item-name">${item.name} ${item.sku ? `<br><small style="color:Gray">SKU: ${item.sku}</small>` : ''}<br>x${item.qty}</span>
                            <span>Rs. ${(item.price * item.qty).toLocaleString()}</span>
                        </div>
                    `).join('')}
                    
                    <div class="divider"></div>
                    
                    <div class="totals">
                        <div><span>Subtotal</span><span>Rs. ${selectedOrder.subtotal.toLocaleString()}</span></div>
                        <div style="font-weight: normal;"><span>Tax</span><span>Rs. ${selectedOrder.tax.toLocaleString()}</span></div>
                        <div style="font-size: 14px; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000;">
                            <span>TOTAL</span><span>Rs. ${selectedOrder.grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div>Payment Method: ${selectedOrder.paymentMethod}</div>
                    ${selectedOrder.paymentMethod === 'Cash' ? `
                    <div>Amount Tendered: Rs. ${selectedOrder.amountRendered.toLocaleString()}</div>
                    <div>Change Returned: Rs. ${selectedOrder.changeReturned.toLocaleString()}</div>
                    ` : ''}
                    
                    <div class="footer">Thank you for shopping with us!</div>
                    
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
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
                    <h1>Happy Hanger - Sales Report</h1>
                    <p style="margin-top: -20px; margin-bottom: 30px; color: #666;">Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</p>
                    
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
                        <tbody>
                            ${filteredOrders.map(order => `
                                <tr>
                                    <td>#${order._id.slice(-6).toUpperCase()}</td>
                                    <td>${format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</td>
                                    <td>${order.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                                    <td>${order.paymentMethod}</td>
                                    <td class="amount">Rs. ${order.grandTotal.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-stone-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Orders Processing</CardTitle>
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
                <Card className="border-stone-200 shadow-sm bg-white bg-gradient-to-br from-stone-900 to-stone-800 text-white">
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
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Search Order ID or Payment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-stone-50/50 border-stone-200"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-stone-50">
                            <TableRow>
                                <TableHead className="font-bold text-stone-900 pl-6">Order ID</TableHead>
                                <TableHead className="font-bold text-stone-900">Date & Time</TableHead>
                                <TableHead className="font-bold text-stone-900">Items</TableHead>
                                <TableHead className="font-bold text-stone-900">Payment</TableHead>
                                <TableHead className="font-bold text-stone-900">Total</TableHead>
                                <TableHead className="text-right font-bold text-stone-900 pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                                            <span className="text-sm text-stone-500">Loading transactions...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
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
                                            <span className="font-mono text-sm font-bold text-stone-800">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-stone-600 text-sm">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-stone-900 font-medium">
                                                <Package className="w-4 h-4 mr-1.5 text-stone-400" />
                                                {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${order.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                }`}>
                                                {order.paymentMethod === 'Card' ? <CreditCard className="w-3 h-3 mr-1" /> : <Banknote className="w-3 h-3 mr-1" />}
                                                {order.paymentMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-stone-900">
                                                Rs. {order.grandTotal.toLocaleString()}
                                            </span>
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
                            {selectedOrder && <span className="font-mono text-sm text-stone-500 bg-stone-100 px-2 py-1 rounded">#{selectedOrder._id.slice(-6).toUpperCase()}</span>}
                        </DialogTitle>
                        <DialogDescription>
                            Complete breakdown of this transaction.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 mt-2 space-y-4 font-mono text-sm">
                            <div className="text-center pb-4 border-b border-stone-200 border-dashed">
                                <h3 className="font-bold text-lg text-stone-900 tracking-widest">HAPPY HANGER</h3>
                                <p className="text-stone-500 text-xs mt-1">{format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy, hh:mm a')}</p>
                            </div>

                            <div className="space-y-3 py-2">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start">
                                        <div className="pr-4">
                                            <div className="font-bold text-stone-900">{item.name}</div>
                                            {item.sku && <div className="text-stone-400 text-[10px] font-mono tracking-wider">{item.sku}</div>}
                                            <div className="text-stone-500 text-xs mt-0.5">{item.qty} x Rs. {item.price.toLocaleString()}</div>
                                        </div>
                                        <div className="font-bold text-stone-800 mt-1">Rs. {(item.price * item.qty).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-stone-200 border-dashed space-y-2">
                                <div className="flex justify-between text-stone-600">
                                    <span>Subtotal</span>
                                    <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Tax</span>
                                    <span>Rs. {selectedOrder.tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-stone-900 pt-2 border-t border-stone-200">
                                    <span>TOTAL</span>
                                    <span>Rs. {selectedOrder.grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-stone-200 space-y-1 text-xs text-stone-500">
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="font-bold text-stone-700">{selectedOrder.paymentMethod}</span>
                                </div>
                                {selectedOrder.paymentMethod === 'Cash' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Amount Tendered:</span>
                                            <span>Rs. {selectedOrder.amountRendered.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Change Returned:</span>
                                            <span>Rs. {selectedOrder.changeReturned.toLocaleString()}</span>
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
