import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Printer, MoreHorizontal, Package } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export function ProductTable({
    products,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onPrintLabel
}) {
    return (
        <Table>
            <TableHeader className="bg-stone-50">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] pl-6 text-stone-900 font-bold">
                        <Checkbox
                            checked={products.length > 0 && selectedIds.length === products.length}
                            onCheckedChange={onSelectAll}
                        />
                    </TableHead>
                    <TableHead className="font-bold text-stone-900">Product Details</TableHead>
                    <TableHead className="font-bold text-stone-900 hidden md:table-cell">Price / Cost</TableHead>
                    <TableHead className="font-bold text-stone-900">Inventory</TableHead>
                    <TableHead className="text-right font-bold text-stone-900 pr-6">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id} className={selectedIds.includes(product._id) ? "bg-stone-50" : ""}>
                        <TableCell className="pl-6">
                            <Checkbox
                                checked={selectedIds.includes(product._id)}
                                onCheckedChange={() => onToggleSelect(product._id)}
                            />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-4 py-1">
                                <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200 shrink-0">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package className="h-6 w-6 text-stone-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-stone-900 truncate uppercase tracking-tight">{product.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">SKU: {product.sku}</span>
                                        <span className="text-[10px] text-stone-400 font-medium">#{product.category?.name || "Uncategorized"}</span>
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="space-y-0.5">
                                <div className="text-sm font-black text-stone-900">Rs. {product.price.toLocaleString()}</div>
                                <div className="text-[10px] text-stone-400 font-medium line-through decoration-stone-300">Cost: Rs. {product.costPrice?.toLocaleString() || 0}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden max-w-[80px]">
                                        <div
                                            className={`h-full rounded-full ${product.stock <= 0 ? 'bg-red-500' : product.stock <= product.minStockLevel ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min((product.stock / (product.stock + 10)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-black ${product.stock <= 0 ? 'text-red-600' : product.stock <= product.minStockLevel ? 'text-amber-600' : 'text-emerald-700'}`}>
                                        {product.stock}
                                    </span>
                                </div>
                                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest leading-none">Units Available</div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-200 hover:bg-stone-50">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1 shadow-xl border-stone-200">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1.5">Quick Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-md gap-2 py-2 cursor-pointer focus:bg-stone-50">
                                        <Edit2 className="w-4 h-4 text-stone-500" />
                                        <span className="font-medium text-stone-700">Edit Product</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onPrintLabel(product)} className="rounded-md gap-2 py-2 cursor-pointer focus:bg-stone-50">
                                        <Printer className="w-4 h-4 text-stone-500" />
                                        <span className="font-medium text-stone-700">Print Tag</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-stone-100" />
                                    <DropdownMenuItem onClick={() => onDelete(product)} className="rounded-md gap-2 py-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                        <span className="font-bold">Delete Item</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
