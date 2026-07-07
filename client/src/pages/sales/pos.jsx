import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo-removebg-preview.png";
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
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!isSuccessOpen) {
            setIsPrinting(false);
        }
    }, [isSuccessOpen]);

    const triggerPrintAnimation = () => {
        if (isPrinting) return;
        setIsPrinting(true);
        setTimeout(() => {
            handlePrintReceipt(lastCompletedOrder);
        }, 1500);
        setTimeout(() => {
            setIsPrinting(false);
        }, 4000);
    };

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products/minimal");
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
        const isElectron = typeof window !== 'undefined' && ((window.process && window.process.versions && window.process.versions.electron) || navigator.userAgent.toLowerCase().includes('electron'));

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

        const printScript = isElectron ? "" : `
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                            // Fallback for some browsers
                            setTimeout(function() { window.close(); }, 1500);
                        };
                    </script>
        `;

        const html = `<!DOCTYPE html>
            <html>
                <head>
                    <base href="${window.location.origin}/">
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
                            <img src="${logoImg}" style="max-height: 45px; margin-bottom: 4px; object-fit: contain;" />
                            <div class="store-name bold">${(currentUser?.brandName || "HAPPY HANGERS").toUpperCase()}</div>
                            <div style="font-size: 8px; margin-top: 2px; line-height: 1.2; font-weight: bold;">Plot # 1898, FB area Block 14, Near KKF general hospital, Karachi</div>
                            <div style="font-size: 9px; margin-top: 2px;">${currentUser?.websiteUrl || "Happyhangers.com.pk"}</div>
                            <div style="font-size: 9px;">Contact: ${currentUser?.phoneNumber || "0300-37-33-571"}</div>
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
                            ${order.discount > 0 ? `<div class="summary-line"><span>DISCOUNT:</span><span>-Rs. ${order.discount.toLocaleString()}</span></div>` : ''}
                            <div class="total-row"><span>GRAND TOTAL:</span><span>Rs. ${order.grandTotal.toLocaleString()}</span></div>
                        </div>
                        
                        <div class="divider"></div>
                        <div class="summary-line"><span>PAYMENT:</span><span class="bold">${order.paymentMethod.toUpperCase()}</span></div>
                        ${order.paymentMethod === "Cash" ? `
                            <div class="summary-line"><span>TENDERED:</span><span>Rs. ${order.amountRendered.toLocaleString()}</span></div>
                            <div class="summary-line"><span>CHANGE:</span><span>Rs. ${order.changeReturned.toLocaleString()}</span></div>
                        ` : ''}
                        
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-stone-900">Sale Complete!</DialogTitle>
                        <DialogDescription>Transaction has been saved to database.</DialogDescription>
                    </DialogHeader>

                    {lastCompletedOrder && (
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
                                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{(currentUser?.brandName || "HAPPY HANGERS").toUpperCase()}</div>
                                            <div style={{ fontSize: '7px', lineHeight: '1.2' }}>Plot # 1898, FB area Block 14, Near KKF general hospital, Karachi</div>
                                            <div style={{ fontSize: '8px', marginTop: '2px' }}>{currentUser?.websiteUrl || "Happyhangers.com.pk"}</div>
                                            <div style={{ fontSize: '8px' }}>Contact: {currentUser?.phoneNumber || "0300-37-33-571"}</div>
                                        </div>
                                        
                                        <div className="receipt-subheader" style={{ fontSize: '7px', borderBottom: '1px dashed #ccc', paddingBottom: '4px', marginTop: '4px', textTransform: 'uppercase' }}>
                                            Order: {lastCompletedOrder.invoiceNo || `#${lastCompletedOrder._id.slice(-6).toUpperCase()}`} <br />
                                            Date: {new Date(lastCompletedOrder.createdAt).toLocaleDateString()} {new Date(lastCompletedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                                                {lastCompletedOrder.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ textAlign: 'left', padding: '3px 0', textTransform: 'uppercase', fontSize: '7px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                                        <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.qty} x</td>
                                                        <td style={{ textAlign: 'right', padding: '3px 0' }}>Rs. {item.price.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="receipt-subtotal" style={{ borderTop: '1px dashed #ccc' }}>
                                                    <td colSpan={2} style={{ padding: '4px 0 2px 0' }}>Subtotal</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0 2px 0' }}>Rs. {lastCompletedOrder.subtotal.toLocaleString()}</td>
                                                </tr>
                                                {lastCompletedOrder.discount > 0 && (
                                                    <tr className="receipt-tax">
                                                        <td colSpan={2} style={{ padding: '2px 0' }}>Discount</td>
                                                        <td style={{ textAlign: 'right', padding: '2px 0' }}>-Rs. {lastCompletedOrder.discount.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                <tr className="receipt-tax">
                                                    <td colSpan={2} style={{ padding: '2px 0' }}>Tax</td>
                                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>Rs. {lastCompletedOrder.tax.toLocaleString()}</td>
                                                </tr>
                                                <tr className="receipt-total" style={{ borderTop: '1px dashed #000', fontWeight: 'bold' }}>
                                                    <td colSpan={2} style={{ padding: '4px 0 0 0', fontSize: '9px' }}>Total</td>
                                                    <td style={{ textAlign: 'right', padding: '4px 0 0 0', fontSize: '9px' }}>Rs. {lastCompletedOrder.grandTotal.toLocaleString()}</td>
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
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsSuccessOpen(false);
                                if (searchInputRef.current) searchInputRef.current.focus();
                            }}
                        >
                            New Transaction
                        </Button>
                        <Button
                            className="bg-stone-900 text-white hover:bg-stone-800"
                            onClick={triggerPrintAnimation}
                            disabled={isPrinting}
                        >
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

  .receipt-subtotal td {
    border-top: 1px dashed #ccc;
  }

  .receipt-total td {
    border-top: 1px dashed #ccc;
    font-weight: 600;
  }

  .receipt-table {
    font: inherit;
    color: inherit;
    text-align: left;
    line-height: 1.5em;

    th:last-child,
    td:last-child {
      text-align: right;
    }
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
