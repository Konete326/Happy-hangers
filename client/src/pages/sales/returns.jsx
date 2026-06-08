import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, RefreshCcw, Undo2, Package, Calendar, User, Receipt } from "lucide-react";
import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";

export default function SalesReturns() {
    const { toast } = useToast();
    const [invoiceId, setInvoiceId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const findOrder = async (e) => {
        if (e) e.preventDefault();
        const trimmedId = invoiceId?.trim();
        if (!trimmedId) return toast({ title: "Input Required", description: "Please enter or paste an Invoice ID." });


        setLoading(true);
        setOrder(null);
        setReturnItems([]);
        try {
            const cleanId = trimmedId.startsWith("#") ? trimmedId.substring(1) : trimmedId;
            const res = await API.get(`/returns/order/${encodeURIComponent(cleanId)}`);
            setOrder(res.data.data);
        } catch (err) {
            toast({ title: "Invoice Not Found", description: "Please check the Invoice ID and try again.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleItemSelection = (item) => {
        const productId = item.product._id || item.product;
        const isSelected = returnItems.find(i => i.product === productId);
        if (isSelected) {
            setReturnItems(prev => prev.filter(i => i.product !== productId));
        } else {
            setReturnItems(prev => [...prev, {
                product: productId,
                name: item.name,
                qty: 1,
                maxQty: item.qty - (item.returnedQty || 0),
                price: item.price,
                subtotal: item.price
            }]);
        }
    };

    const updateReturnQty = (productId, newQty) => {
        setReturnItems(prev => prev.map(item => {
            if (item.product === productId) {
                const qty = Math.min(Math.max(1, newQty), item.maxQty);
                return { ...item, qty, subtotal: qty * item.price };
            }
            return item;
        }));
    };

    const calculateRefundTotal = () => {
        return returnItems.reduce((acc, item) => acc + item.subtotal, 0);
    };

    const processReturn = async () => {
        if (returnItems.length === 0) return;
        setIsSubmitting(true);
        try {
            await API.post("/returns", {
                orderId: order._id,
                items: returnItems,
                refundAmount: calculateRefundTotal(),
                reason
            });
            toast({ title: "Refund Processed!", description: "Stock updated and refund recorded successfully." });
            setOrder(null);
            setInvoiceId("");
            setReturnItems([]);
            setReason("");
        } catch (err) {
            toast({ title: "Return Failed", description: err.response?.data?.message || "Something went wrong", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 bg-stone-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                <Card className="lg:col-span-4 border-stone-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-stone-100 pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-stone-400">Locate Invoice</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <form onSubmit={findOrder} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceId" className="text-xs font-bold text-stone-700">Order ID / Invoice #</Label>
                                <div className="relative">
                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input
                                        id="invoiceId"
                                        placeholder="Paste order ID here..."
                                        value={invoiceId}
                                        onChange={(e) => setInvoiceId(e.target.value)}
                                        className="pl-10 h-12 bg-stone-50 border-stone-200 font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !invoiceId.trim()}
                                className="w-full bg-stone-900 text-white hover:bg-stone-800 h-12 font-bold uppercase tracking-widest text-xs"
                            >
                                {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                                Fetch Invoice
                            </Button>
                        </form>
                        {!order && !loading && (
                            <div className="py-12 text-center space-y-3">
                                <Package className="w-10 h-10 text-stone-200 mx-auto" />
                                <p className="text-xs text-stone-400 font-medium px-6">Enter an existing Invoice ID to start a return process.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-8 space-y-6">
                    {order && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <Card className="border-stone-900 bg-stone-900 text-white shadow-xl overflow-hidden">
                                <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Order Status</div>
                                        <Badge className={`bg-white/10 text-white border-white/20`}>{order.status}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Cashier</div>
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-white/40" />
                                            {order.cashier?.name}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Date</div>
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-white/40" />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Original Total</div>
                                        <div className="text-lg font-black tracking-tighter">Rs. {order.grandTotal.toLocaleString()}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="border-b border-stone-100 flex flex-row items-center justify-between py-4">
                                    <div>
                                        <CardTitle className="text-base font-bold text-stone-900">Select Items to Return</CardTitle>
                                        <CardDescription className="text-xs">Only non-returned items are listed below.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-stone-50">{order.items.length} Items</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="max-h-[400px]">
                                        <div className="divide-y divide-stone-100">
                                            {order.items.map((item, idx) => {
                                                const canReturn = item.qty - (item.returnedQty || 0);
                                                const productId = item.product?._id || item.product;
                                                const isSelected = !!returnItems.find(i => i.product === productId);

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-4 flex items-center gap-4 transition-colors ${canReturn === 0 ? 'bg-stone-50 opacity-50' : 'hover:bg-stone-50/50'}`}
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => canReturn > 0 && toggleItemSelection(item)}
                                                                disabled={canReturn === 0}
                                                                className="h-5 w-5 border-stone-200 data-[state=checked]:bg-stone-900"
                                                            />
                                                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                                                                <Package className="w-5 h-5 text-stone-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-stone-900 truncate">{item.name}</p>
                                                                <p className="text-[10px] font-mono text-stone-400 uppercase">SKU: {item.sku || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-8 pr-4">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-stone-400 tracking-widest uppercase">Purchased</p>
                                                                <p className="text-sm font-black text-stone-900">{item.qty}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-stone-400 tracking-widest uppercase">Returned</p>
                                                                <p className="text-sm font-black text-stone-900">{item.returnedQty || 0}</p>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 rounded-lg"
                                                                        onClick={() => updateReturnQty(productId, (returnItems.find(i => i.product === productId)?.qty || 0) - 1)}
                                                                    >
                                                                        <RefreshCcw className="w-3 h-3 text-stone-400" />
                                                                    </Button>
                                                                    <Input
                                                                        type="number"
                                                                        className="w-12 h-7 p-0 text-center text-xs font-black bg-transparent border-none focus-visible:ring-0"
                                                                        value={returnItems.find(i => i.product === productId)?.qty}
                                                                        onChange={(e) => updateReturnQty(productId, parseInt(e.target.value))}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {returnItems.length > 0 && (
                                <Card className="border-emerald-100 bg-emerald-50 shadow-lg animate-in zoom-in-95 duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6 items-end">
                                            <div className="flex-1 space-y-4 w-full">
                                                <div className="space-y-2">
                                                    <Label htmlFor="reason" className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 pl-1">Reason for Return</Label>
                                                    <Input
                                                        id="reason"
                                                        placeholder="Defected item, size mismatch, etc."
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        className="bg-white border-emerald-200 h-11 text-sm font-medium focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white/50 rounded-2xl border border-emerald-200">
                                                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Items for Restock</p>
                                                        <p className="text-xl font-black text-emerald-900">{returnItems.reduce((acc, i) => acc + i.qty, 0)} Units</p>
                                                    </div>
                                                    <div className="p-4 bg-emerald-600 rounded-2xl border border-emerald-700 shadow-inner">
                                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Refund</p>
                                                        <p className="text-xl font-black text-white">Rs. {calculateRefundTotal().toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={processReturn}
                                                disabled={isSubmitting}
                                                className="w-full md:w-auto min-w-[200px] h-14 bg-stone-900 text-white hover:bg-stone-800 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3"
                                            >
                                                {isSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Undo2 className="w-5 h-5" />}
                                                Confirm & Refund
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
