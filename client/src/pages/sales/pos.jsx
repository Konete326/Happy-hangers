import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Barcode,
    CreditCard,
    PackageOpen,
    Receipt,
    Printer,
    RefreshCw,
    Tag,
    Undo2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import API from "@/api/api";

import { useAuth } from "@/context/AuthContext";
export default function POS() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem("pos_cart");
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const searchInputRef = useRef(null);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [amountRendered, setAmountRendered] = useState("");
    const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products");
            setProducts(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load products for POS", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem("pos_cart", JSON.stringify(cart));
    }, [cart]);


    // Global Key Listener: Allows scanning without clicking the search box
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ignore if user is in a dialog/modal or focusing another input
            if (isCheckoutOpen || isSuccessOpen) return;

            const target = e.target;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            // If they are not typing in another input, redirect everything to search
            if (!isInput && e.key.length === 1) {
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isCheckoutOpen, isSuccessOpen]);

    const filteredProducts = products.filter(prod => {
        const query = searchTerm.toLowerCase();
        return prod.name.toLowerCase().includes(query) ||
            prod.sku.toLowerCase().includes(query) ||
            prod.barcode?.toLowerCase().includes(query);
    });

    // Consolidated auto-scan and search handler with diagnostic feedback
    const processScan = (term) => {
        // Aggressive cleaning: Remove EVERYTHING except letters and numbers
        const cleanTerm = term.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (cleanTerm.length < 3) return false;

        const exactMatch = products.find(p => {
            const pBarcode = (p.barcode || "").trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const pSku = (p.sku || "").trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return pBarcode === cleanTerm || pSku === cleanTerm;
        });

        if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm("");
            return true;
        } else {
            // Diagnostic: Show what was actually received if it looks like a barcode
            if (term.length > 5) {
                toast({
                    title: "Scan Detected",
                    description: `Code: "${term}" - No product match found in database.`,
                    variant: "destructive",
                    duration: 3000
                });
            }
        }
        return false;
    };

    useEffect(() => {
        // We only auto-process if the term ends with a character that often comes from scanners
        // Or if it's long enough to be a barcode
        if (searchTerm.length >= 8) {
            const timer = setTimeout(() => {
                processScan(searchTerm);
            }, 300); // Small buffer for rapid typing
            return () => clearTimeout(timer);
        }
    }, [searchTerm, products]);

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            processScan(searchTerm);
            setSearchTerm("");
        }
    };

    const addToCart = (product) => {
        if (product.stock <= 0) {
            toast({ title: "Out of Stock", description: "Cannot add unavailable items.", variant: "destructive" });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            let newCart;
            let newQty = 1;

            if (existing) {
                if (existing.qty >= product.stock) {
                    toast({ title: "Limit Reached", description: `Only ${product.stock} in stock.`, variant: "destructive" });
                    return prev;
                }
                newQty = existing.qty + 1;
                newCart = prev.map(item => item._id === product._id ? { ...item, qty: newQty } : item);
            } else {
                const finalPrice = (product.onSale && product.discountPrice > 0) ? product.discountPrice : product.price;
                newCart = [...prev, { ...product, price: finalPrice, originalPrice: product.price, qty: 1 }];
            }

            return newCart;
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === id) {
                const newQty = item.qty + delta;
                if (newQty > item.stock) {
                    toast({ title: "Stock Limit", description: "Not enough inventory.", variant: "destructive" });
                    return item;
                }
                return { ...item, qty: Math.max(1, newQty) };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item._id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const taxRate = 0;
    const tax = subtotal * taxRate;
    const discount = 0;
    const grandTotal = subtotal + tax - discount;

    const returnChange = paymentMethod === "Cash" && parseFloat(amountRendered) > grandTotal
        ? parseFloat(amountRendered) - grandTotal
        : 0;

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsCheckoutOpen(true);
        setAmountRendered("");
    };

    const handlePrintReceipt = (order) => {
        if (!order) return;
        const printWindow = window.open("", "", "width=400,height=600");
        if (!printWindow) return;

        const itemsHtml = order.items.map(item => `
            <div class="item">
                <div class="item-info">
                    <div class="item-name bold">${item.name}</div>
                    ${item.sku ? `<div class="item-sku">sku : ${item.sku}</div>` : ""}
                    <div class="item-qty">${item.qty} x Rs. ${item.price.toLocaleString()}</div>
                </div>
                <div class="item-total bold">Rs.${(item.price * item.qty).toLocaleString()}</div>
            </div>`).join("");

        const cashLines = order.paymentMethod === "Cash"
            ? `<div class="summary-line"><span>TENDERED:</span><span>Rs. ${order.amountRendered.toLocaleString()}</span></div>
               <div class="summary-line"><span>CHANGE:</span><span>Rs. ${order.changeReturned.toLocaleString()}</span></div>`
            : "";

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <title>POS Receipt - ${order._id}</title>
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
                            -webkit-print-color-adjust: exact;
                        }
                        .container { width: 100%; padding: 0 1mm; }
                        .center { text-align: center; }
                        .bold { font-weight: 900; }
                        .store-name { 
                            font-size: 16px; 
                            margin-bottom: 2px; 
                            letter-spacing: 1px;
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
                        .item-details { font-size: 9px; margin-top: 1px; }
                        .item-total { font-weight: bold; font-size: 11px; white-space: nowrap; }
                        
                        .summary { margin-top: 4px; }
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
                            line-height: 1.3;
                        }
                        .barcode { 
                            margin-top: 8px; 
                            text-align: center;
                        }
                        @media print { 
                            body { width: 72mm; margin: 0; } 
                            .divider { border-bottom: 1px dashed #000 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="center">
                            ${currentUser?.logo ? `<img src="${currentUser.logo}" style="max-height: 40px; margin-bottom: 4px;" />` : ''}
                            <div class="store-name bold">${currentUser?.brandName?.toUpperCase() || "HAPPY HANGERS"}</div>
                            <div class="bold" style="font-size: 8px; letter-spacing: 2px; margin-bottom: 4px;">FASHION & APPAREL</div>
                            <div style="font-size: 9px;">Contact: ${currentUser?.phoneNumber || "03XX-XXXXXXX"}</div>
                            <div style="font-size: 8px;">${currentUser?.address || "Warehouse City, Pakistan"}</div>
                        </div>
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>ORDER:</span><span class="bold">#${order._id.slice(-8).toUpperCase()}</span></div>
                        <div class="summary-line"><span>DATE:</span><span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
                        <div class="summary-line"><span>CASHIER:</span><span>${currentUser?.name?.toUpperCase() || "ADMIN"}</span></div>
                        
                        <div class="divider"></div>
                        <div class="bold" style="font-size: 9px; margin-bottom: 4px; text-decoration: underline;">ITEMS DESCRIPTION</div>
                        ${itemsHtml}
                        
                        <div class="divider"></div>
                        <div class="summary">
                            <div class="summary-line"><span>SUBTOTAL:</span><span>Rs. ${order.subtotal.toLocaleString()}</span></div>
                            <div class="summary-line"><span>TAX (0%):</span><span>Rs. ${order.tax.toLocaleString()}</span></div>
                            {order.discount > 0 ? \`<div class="summary-line"><span>DISCOUNT:</span><span>-Rs. \${order.discount.toLocaleString()}</span></div>\` : ''}
                            <div class="total-row"><span>GRAND TOTAL:</span><span>Rs. ${order.grandTotal.toLocaleString()}</span></div>
                        </div>
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>PAYMENT:</span><span class="bold">${order.paymentMethod.toUpperCase()}</span></div>
                        ${order.paymentMethod === "Cash" ? `
                            <div class="summary-line"><span>TENDERED:</span><span>Rs. ${order.amountRendered.toLocaleString()}</span></div>
                            <div class="summary-line"><span>CHANGE:</span><span>Rs. ${order.changeReturned.toLocaleString()}</span></div>
                        ` : ''}
                        
                        <div class="divider"></div>
                        <div class="center footer">
                            <div class="bold">THANK YOU FOR YOUR PATRONAGE!</div>
                            <div style="margin-top: 4px;">Exchange within 7 days with original receipt.</div>
                            <div style="margin-top: 2px;">Items must be in original condition with tags.</div>
                            <div style="margin-top: 6px; font-size: 7px; opacity: 0.6;">System Powered by Happy Hangers POS</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                            // Fallback for some browsers
                            setTimeout(function() { window.close(); }, 1500);
                        };
                    </script>
                </body>
            </html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const confirmCheckout = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const orderData = {
                items: cart.map(item => ({
                    product: item._id,
                    name: item.name,
                    sku: item.sku,
                    price: item.price,
                    qty: item.qty
                })),
                subtotal,
                tax,
                discount,
                grandTotal,
                paymentMethod,
                amountRendered: amountRendered ? parseFloat(amountRendered) : 0,
                changeReturned: returnChange
            };

            const response = await API.post("/orders", orderData);
            const orderResult = response.data.data;

            if (response.data.status === "success" || orderResult) {
                toast({
                    title: "Success!",
                    description: `Order processed. Total: Rs. ${grandTotal.toLocaleString()}`
                });

                setCart([]);
                setIsCheckoutOpen(false);

                // Ensure everything is handled before navigating
                const targetOrder = orderResult || response.data;
                const orderId = targetOrder._id;

                if (orderId) {
                    navigate(`/orders?openReceipt=${orderId}`);
                } else {
                    navigate("/orders");
                }
            }
            fetchProducts();
        } catch (error) {
            toast({ title: "Checkout Failed", description: error.response?.data?.message || "Could not process order.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 animate-in fade-in duration-500 bg-stone-50/30 overflow-hidden min-h-0">

            <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                <Card className="border-stone-200 shadow-sm shrink-0">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Scan Barcode or Search Products..."
                                className="pl-10 h-12 text-lg bg-stone-50 border-stone-200 focus:bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 border-stone-200"
                            onClick={() => {
                                if (searchTerm.replace(/\s/g, '').length > 0) {
                                    const cleanTerm = searchTerm.replace(/\s/g, '').toLowerCase();
                                    const exactMatch = products.find(p =>
                                        (p.barcode && p.barcode.replace(/\s/g, '').toLowerCase() === cleanTerm) ||
                                        (p.sku && p.sku.replace(/\s/g, '').toLowerCase() === cleanTerm)
                                    );
                                    if (exactMatch) {
                                        addToCart(exactMatch);
                                        setSearchTerm("");
                                    } else {
                                        toast({ title: "Product Not Found", description: "No item matches that barcode/SKU.", variant: "destructive" });
                                    }
                                } else if (searchInputRef.current) {
                                    searchInputRef.current.focus();
                                    toast({ title: "Scanner Ready", description: "You can now scan a barcode." });
                                }
                            }}
                        >
                            <Barcode className="w-5 h-5 mr-2" />
                            Scan
                        </Button>

                        <Link to="/returns">
                            <Button
                                variant="outline"
                                className="h-12 border-stone-200 flex items-center gap-2 hover:bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-widest"
                            >
                                <Undo2 className="w-4 h-4" />
                                Return Sale
                            </Button>
                        </Link>
                    </CardContent>
                </Card>


                <ScrollArea className="flex-1 min-h-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center p-12">
                            <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 p-12">
                            <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">No products found matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                            {filteredProducts.map(product => (
                                <Card
                                    key={product._id}
                                    className={`cursor-pointer transition-all hover:shadow-md border-stone-200 overflow-hidden flex flex-col ${product.stock <= 0 ? 'opacity-50 grayscale' : 'hover:border-stone-400'}`}
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="h-32 bg-stone-100 flex items-center justify-center relative">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <PackageOpen className="w-8 h-8 text-stone-300" />
                                        )}
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">SOLD OUT</span>
                                            </div>
                                        )}
                                        {product.stock > 0 && product.stock <= product.minStockLevel && (
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">LOW STOCK</span>
                                            </div>
                                        )}
                                        {product.onSale && (
                                            <div className="absolute top-2 left-2">
                                                <div className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-emerald-200 uppercase tracking-widest border border-emerald-500">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {product.saleLabel || "SALE"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-3 flex-1 flex flex-col justify-between bg-white border-t border-stone-100">
                                        <div className="mb-2">
                                            <h3 className="font-semibold text-stone-800 text-sm line-clamp-2 leading-snug tracking-tight">{product.name}</h3>
                                            <p className="text-[10px] text-stone-400 mt-1 font-mono uppercase bg-stone-50 inline-block px-1.5 py-0.5 rounded border border-stone-100">{product.sku}</p>
                                        </div>
                                        <div className="flex flex-col mt-auto">
                                            {product.onSale && product.discountPrice > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="font-black text-emerald-600 text-lg tracking-tighter leading-none">Rs. {Number(product.discountPrice).toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-stone-400 line-through">Rs. {Number(product.price).toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <span className="font-black text-stone-900 text-base tracking-tight">Rs. {Number(product.price).toLocaleString()}</span>
                                            )}
                                        </div>
                                        {product.stock > 0 ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">{product.stock} left</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shadow-sm">0 left</span>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>


            <Card className="w-full lg:w-[400px] flex flex-col h-full shrink-0 border-stone-200 shadow-xl overflow-hidden min-h-0">
                <CardHeader className="p-4 border-b bg-stone-50 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Current Order
                        </CardTitle>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={cart.length === 0} className="text-stone-500 hover:text-red-600 font-bold uppercase text-[10px] tracking-tight">
                                    Clear Cart
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-black text-stone-900 uppercase tracking-tighter">Empty Cart?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-stone-500 font-medium leading-relaxed">
                                        This will permanently remove all <span className="font-bold text-stone-900">{cart.length} items</span> from your current order. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4 gap-2">
                                    <AlertDialogCancel className="border-stone-200 text-stone-600 font-bold uppercase text-xs">Keep Items</AlertDialogCancel>
                                    <AlertDialogAction onClick={clearCart} className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs px-6">
                                        Yes, Clear All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1 min-h-0">
                    {cart.length === 0 ? (
                        <div className="py-2 flex flex-col items-center justify-center text-stone-400 space-y-4">
                            <Receipt className="w-16 h-16 opacity-20" />
                            <p>Cart is empty. Scan or select an item.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {cart.map(item => (
                                <div key={item._id} className="p-4 flex gap-3 hover:bg-stone-50 transition-colors">
                                    <div className="w-12 h-12 rounded bg-stone-100 overflow-hidden shrink-0">
                                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <PackageOpen className="w-full h-full p-2 text-stone-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-stone-900 truncate">{item.name}</h4>
                                        <div className="text-xs text-stone-500 mt-0.5">Rs. {item.price.toLocaleString()} x {item.qty}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button variant="outline" size="icon" className="h-6 w-6 rounded border-stone-300" onClick={() => updateQty(item._id, -1)}>
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6 rounded border-stone-300" onClick={() => updateQty(item._id, 1)}>
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between shrink-0">
                                        <span className="font-bold text-stone-900 text-sm">Rs. {(item.price * item.qty).toLocaleString()}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromCart(item._id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <CardFooter className="shrink-0 p-4 border-t flex flex-col bg-white">
                    <div className="w-full space-y-2 mb-4">
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Subtotal</span>
                            <span>Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Tax (0%)</span>
                            <span>Rs. {tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t">
                            <span>Total</span>
                            <span>Rs. {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="w-full h-14 bg-stone-900 hover:bg-stone-800 text-lg shadow-lg"
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                    >
                        Checkout  •  Rs. {grandTotal.toLocaleString()}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Complete Payment</DialogTitle>
                        <DialogDescription>
                            Select payment method and confirm the transaction.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                            <div className="text-center">
                                <p className="text-sm text-stone-500 font-medium uppercase tracking-wider mb-1">Total Amount Due</p>
                                <h2 className="text-4xl font-black text-stone-900">Rs. {grandTotal.toLocaleString()}</h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Payment Method</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={paymentMethod === "Cash" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("Cash")}
                                    className={paymentMethod === "Cash" ? "bg-stone-900 text-white" : ""}
                                >
                                    Cash
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === "Card" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("Card")}
                                    className={paymentMethod === "Card" ? "bg-stone-900 text-white" : ""}
                                >
                                    Credit / Debit Card
                                </Button>
                            </div>
                        </div>

                        {paymentMethod === "Cash" && (
                            <div className="space-y-3">
                                <Label htmlFor="amountRendered">Amount Tendered (Rs.)</Label>
                                <Input
                                    id="amountRendered"
                                    type="number"
                                    className="h-12 text-lg"
                                    placeholder="Enter amount given by customer"
                                    value={amountRendered}
                                    onChange={(e) => setAmountRendered(e.target.value)}
                                />
                                {returnChange > 0 && parseFloat(amountRendered) >= grandTotal && (
                                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded flex justify-between font-bold">
                                        <span>Change to Return:</span>
                                        <span>Rs. {returnChange.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 min-w-[160px]"
                            onClick={confirmCheckout}
                            disabled={isSubmitting || (paymentMethod === "Cash" && (amountRendered === "" || parseFloat(amountRendered) < grandTotal))}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="sm:max-w-[400px] text-center p-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                            <Receipt className="w-10 h-10" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-stone-900">Sale Complete!</DialogTitle>
                            <DialogDescription>
                                Transaction has been saved to database.
                            </DialogDescription>
                        </DialogHeader>

                        {lastCompletedOrder && (
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 my-2 text-left space-y-3 font-mono text-[11px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                <div className="text-center pb-2 border-b border-dashed border-stone-300 flex flex-col items-center">
                                    {currentUser?.logo && <img src={currentUser.logo} alt="Logo" className="h-6 mb-1 object-contain" />}
                                    <div className="font-bold text-stone-900">{currentUser?.brandName?.toUpperCase()}</div>
                                    <div className="text-stone-500 text-[10px]">{new Date().toLocaleString()}</div>
                                </div>
                                <div className="space-y-2">
                                    {lastCompletedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <div>
                                                <div className="font-bold text-stone-900 uppercase">{item.name}</div>
                                                <div>sku: {item.sku}</div>
                                                <div>{item.qty} x Rs. {item.price.toLocaleString()}</div>
                                            </div>
                                            <div className="font-bold text-stone-900">Rs. {(item.price * item.qty).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2 border-t border-dashed border-stone-300 space-y-1">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>Rs. {lastCompletedOrder.subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between font-black text-sm text-stone-900 pt-1 border-t border-stone-900"><span>TOTAL:</span><span>Rs. {lastCompletedOrder.grandTotal.toLocaleString()}</span></div>
                                </div>
                                <div className="pt-2 border-t border-stone-200 space-y-1 text-stone-500 uppercase tracking-tight">
                                    <div className="flex justify-between"><span>Method:</span><span className="font-bold text-stone-700">{lastCompletedOrder.paymentMethod}</span></div>
                                    {lastCompletedOrder.paymentMethod === "Cash" && (
                                        <>
                                            <div className="flex justify-between"><span>Tendered:</span><span>Rs. {lastCompletedOrder.amountRendered.toLocaleString()}</span></div>
                                            <div className="flex justify-between font-bold text-stone-700"><span>Change:</span><span>Rs. {lastCompletedOrder.changeReturned.toLocaleString()}</span></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="w-full space-y-3 mt-4">
                            <Button
                                className="w-full h-12 bg-stone-900 text-white hover:bg-stone-800"
                                onClick={() => {
                                    handlePrintReceipt(lastCompletedOrder);
                                }}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Thermal Receipt
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-12 border-stone-200"
                                onClick={() => {
                                    setIsSuccessOpen(false);
                                    if (searchInputRef.current) searchInputRef.current.focus();
                                }}
                            >
                                New Transaction
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
