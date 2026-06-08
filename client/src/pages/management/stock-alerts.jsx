import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, XCircle, Package, RefreshCw, Plus, Minus, CheckCircle2, Search, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import API from "@/api/api";

export default function StockAlerts() {
    const { toast } = useToast();
    const [data, setData] = useState({ outOfStock: [], lowStock: [] });
    const [loading, setLoading] = useState(true);
    const [restockProduct, setRestockProduct] = useState(null);
    const [restockQty, setRestockQty] = useState(0);
    const [saving, setSaving] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [categories, setCategories] = useState([]);


    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await API.get("/products/alerts");
            setData(res.data.data);
        } catch {
            toast({ title: "Error", description: "Failed to load stock alerts.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchCategories = async () => {
        try {
            const res = await API.get("/categories");
            setCategories(res.data.data);
        } catch (error) {
            console.error("Failed to load categories");
        }
    };

    useEffect(() => {
        fetchAlerts();
        fetchCategories();
    }, [fetchAlerts]);


    const openRestock = (product) => {
        setRestockProduct(product);
        setRestockQty(product.minStockLevel * 2 || 10);
    };

    const handleRestock = async () => {
        if (!restockProduct) return;
        setSaving(true);
        try {
            const newStock = restockProduct.stock + restockQty;
            await API.patch(`/products/${restockProduct._id}/stock`, { stock: newStock });
            toast({ title: "Restocked!", description: `${restockProduct.name} updated to ${newStock} units.` });
            setRestockProduct(null);
            fetchAlerts();
        } catch {
            toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const filterList = (list) => {
        return list.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === "all" || p.category?._id === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    };

    const filteredOut = filterList(data.outOfStock);
    const filteredLow = filterList(data.lowStock);
    const totalAlerts = filteredOut.length + filteredLow.length;


    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900">Stock Alerts</h1>
                    <p className="text-sm text-stone-500 mt-0.5">Monitor and restock low inventory items.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchAlerts} className="border-stone-200 text-stone-700 hover:bg-stone-100">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Row */}
            <Card className="border-stone-200 shadow-sm bg-white overflow-visible">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Find product by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-stone-50/50 border-stone-200 focus:bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest min-w-fit">
                            <Filter className="w-3.5 h-3.5" />
                            Category:
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-48 bg-stone-50/50 border-stone-200">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-red-100 bg-red-50 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-red-700">{data.outOfStock.length}</div>
                            <div className="text-xs font-medium text-red-500">Out of Stock</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-100 bg-amber-50 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-amber-700">{data.lowStock.length}</div>
                            <div className="text-xs font-medium text-amber-500">Low Stock</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-stone-200 bg-white shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-stone-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900">{totalAlerts}</div>
                            <div className="text-xs font-medium text-stone-500">Total Alerts</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card className="border-stone-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-stone-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-stone-900">Out of Stock</CardTitle>
                                    <CardDescription>These products have zero inventory and cannot be sold.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <AlertTable
                                products={filteredOut}
                                type="out"
                                onRestock={openRestock}
                                emptyMsg={searchTerm || categoryFilter !== 'all' ? "No matching alerts." : "No out-of-stock products."}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-stone-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-stone-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-stone-900">Low Stock</CardTitle>
                                    <CardDescription>These products are at or below their minimum stock threshold.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <AlertTable
                                products={filteredLow}
                                type="low"
                                onRestock={openRestock}
                                emptyMsg={searchTerm || categoryFilter !== 'all' ? "No matching alerts." : "No low-stock products."}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            <Dialog open={!!restockProduct} onOpenChange={(open) => !open && setRestockProduct(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Restock Product</DialogTitle>
                        <DialogDescription>
                            Add inventory units for <span className="font-semibold text-stone-800">{restockProduct?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    {restockProduct && (
                        <div className="space-y-4 py-2">
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex justify-between items-center">
                                <span className="text-sm text-stone-500">Current Stock</span>
                                <span className="text-lg font-black text-stone-900">{restockProduct.stock} units</span>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-2">Units to Add</label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setRestockQty(q => Math.max(1, q - 1))}
                                        className="shrink-0"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={restockQty}
                                        onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="text-center font-bold text-lg"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setRestockQty(q => q + 1)}
                                        className="shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex justify-between items-center">
                                <span className="text-sm text-emerald-700">New Total Stock</span>
                                <span className="text-lg font-black text-emerald-700">{restockProduct.stock + restockQty} units</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRestockProduct(null)}>Cancel</Button>
                        <Button
                            className="bg-stone-900 text-white hover:bg-stone-800"
                            onClick={handleRestock}
                            disabled={saving}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Confirm Restock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AlertTable({ products, type, onRestock, emptyMsg }) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <CheckCircle2 className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-sm">{emptyMsg}</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader className="bg-stone-50">
                <TableRow>
                    <TableHead className="pl-6 font-bold text-stone-900">Product</TableHead>
                    <TableHead className="font-bold text-stone-900">Category</TableHead>
                    <TableHead className="font-bold text-stone-900">SKU</TableHead>
                    <TableHead className="font-bold text-stone-900">Stock</TableHead>
                    <TableHead className="font-bold text-stone-900">Min. Level</TableHead>
                    <TableHead className="font-bold text-stone-900">Status</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-stone-900">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((p) => (
                    <TableRow key={p._id} className="hover:bg-stone-50/50 transition-colors">
                        <TableCell className="pl-6 font-semibold text-stone-800">{p.name}</TableCell>
                        <TableCell className="text-stone-500 text-sm">{p.category?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-stone-500">{p.sku}</TableCell>
                        <TableCell>
                            <span className={`font-black text-base ${type === "out" ? "text-red-600" : "text-amber-600"}`}>
                                {p.stock}
                            </span>
                        </TableCell>
                        <TableCell className="text-stone-500 text-sm">{p.minStockLevel}</TableCell>
                        <TableCell>
                            {type === "out" ? (
                                <Badge className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-50">Out of Stock</Badge>
                            ) : (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-50">Low Stock</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRestock(p)}
                                className="text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Restock
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
