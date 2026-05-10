import { useState, useEffect, useRef } from "react";
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
    Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

export default function POS() {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const searchInputRef = useRef(null);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [amountRendered, setAmountRendered] = useState("");

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    const filteredProducts = products.filter(prod => {
        const query = searchTerm.toLowerCase();
        return prod.name.toLowerCase().includes(query) ||
            prod.sku.toLowerCase().includes(query) ||
            prod.barcode?.toLowerCase().includes(query);
    });

    useEffect(() => {
        if (searchTerm.length >= 4) {
            const exactMatch = products.find(p => p.barcode?.toLowerCase() === searchTerm.toLowerCase() || p.sku.toLowerCase() === searchTerm.toLowerCase());
            if (exactMatch) {
                addToCart(exactMatch);
                setSearchTerm("");
            }
        }
    }, [searchTerm, products]);

    const addToCart = (product) => {
        if (product.stock <= 0) {
            toast({ title: "Out of Stock", description: "Cannot add unavailable items.", variant: "destructive" });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    toast({ title: "Stock Limit Reached", description: "Cannot add more than available inventory.", variant: "destructive" });
                    return prev;
                }
                return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
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

    const confirmCheckout = async () => {
        try {
            const token = localStorage.getItem("token");
            const orderData = {
                items: cart.map(item => ({
                    product: item._id,
                    name: item.name,
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

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({ title: "Success!", description: `Order processed. Total: Rs. ${grandTotal.toLocaleString()}` });
            setCart([]);
            setIsCheckoutOpen(false);
            fetchProducts();
        } catch (error) {
            toast({ title: "Checkout Failed", description: "Could not process order.", variant: "destructive" });
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-4 animate-in fade-in duration-500">

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
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 border-stone-200"
                            onClick={() => {
                                if (searchTerm.trim().length > 0) {
                                    const exactMatch = products.find(p => p.barcode?.toLowerCase() === searchTerm.toLowerCase() || p.sku.toLowerCase() === searchTerm.toLowerCase());
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
                    </CardContent>
                </Card>

                <ScrollArea className="flex-1">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
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
                                    </div>
                                    <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-tight">{product.name}</h3>
                                            <p className="text-[10px] text-stone-500 mt-1 font-mono">{product.sku}</p>
                                        </div>
                                        <div className="mt-2 flex items-end justify-between">
                                            <span className="font-bold text-emerald-600">Rs. {product.price.toLocaleString()}</span>
                                            <span className="text-xs text-stone-500">{product.stock} left</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>


            <Card className="w-full lg:w-[400px] flex flex-col h-full shrink-0 border-stone-200 shadow-xl overflow-hidden">
                <CardHeader className="p-4 border-b bg-stone-50 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Current Order
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0} className="text-stone-500 hover:text-red-600">
                            Clear
                        </Button>
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-0">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 space-y-4">
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11"
                            onClick={confirmCheckout}
                            disabled={paymentMethod === "Cash" && (amountRendered === "" || parseFloat(amountRendered) < grandTotal)}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
