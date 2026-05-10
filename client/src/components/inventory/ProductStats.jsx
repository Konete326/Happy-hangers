import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, Boxes } from "lucide-react";

export function ProductStats({ products }) {
    const outOfStock = products.filter(p => (p.stock || 0) <= 0).length;
    const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStockLevel || 5)).length;
    const totalItems = products.length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-stone-50/50">
                    <CardTitle className="text-sm font-medium text-stone-500 uppercase tracking-wider">Out of Stock</CardTitle>
                    <div className="p-2 bg-red-50 rounded-lg text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black text-stone-900">{outOfStock}</div>
                    <p className="text-xs text-red-600 font-medium mt-1">Requires immediate restock</p>
                </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-stone-50/50">
                    <CardTitle className="text-sm font-medium text-stone-500 uppercase tracking-wider">Low Stock</CardTitle>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                        <Package className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black text-stone-900">{lowStock}</div>
                    <p className="text-xs text-amber-600 font-medium mt-1">Below minimum threshold</p>
                </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/5">
                    <CardTitle className="text-sm font-medium text-stone-400 uppercase tracking-wider">Total Products</CardTitle>
                    <div className="p-2 bg-white/10 rounded-lg text-white transition-colors group-hover:bg-white group-hover:text-stone-900">
                        <Boxes className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black">{totalItems}</div>
                    <p className="text-xs text-stone-400 mt-1">Active inventory items</p>
                </CardContent>
            </Card>
        </div>
    );
}
