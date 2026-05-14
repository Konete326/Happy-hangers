import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, AlertCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import API from "@/api/api";

// Modular Components
import { ProductStats } from "@/components/inventory/ProductStats";
import { ProductTable } from "@/components/inventory/ProductTable";
import { ProductModal } from "@/components/inventory/ProductModal";
import { BatchActionBar } from "@/components/inventory/BatchActionBar";

export default function Products() {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters States
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
    const [selectedStockFilter, setSelectedStockFilter] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        category: "",
        subCategory: "",
        price: "",
        costPrice: "",
        stock: "",
        minStockLevel: "5",
        images: []
    });

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products");
            setProducts(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories");
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to load categories");
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            sku: "",
            barcode: "",
            category: "",
            subCategory: "",
            price: "",
            costPrice: "",
            stock: "",
            minStockLevel: "5",
            images: []
        });
        setEditingProduct(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            if (editingProduct) {
                await API.patch(`/products/${editingProduct._id}`, formData);
                toast({ title: "Success", description: "Product updated successfully" });
            } else {
                await API.post("/products", formData);
                toast({ title: "Success", description: "Product created successfully" });
            }
            setIsModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Operation failed",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || "",
            sku: product.sku,
            barcode: product.barcode || "",
            category: product.category?._id || product.category || "",
            subCategory: product.subCategory?._id || product.subCategory || "",
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            minStockLevel: product.minStockLevel || "5",
            images: product.images || []
        });
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await API.delete(`/products/${productToDelete._id}`);
            toast({ title: "Deleted", description: "Product removed successfully" });
            fetchProducts();
            setSelectedIds(prev => prev.filter(id => id !== productToDelete._id));
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const handleBatchDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id =>
                API.delete(`/products/${id}`)
            ));
            toast({ title: "Batch Deleted", description: `${selectedIds.length} products removed.` });
            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            toast({ title: "Operation Failed", description: "One or more products could not be deleted.", variant: "destructive" });
        } finally {
            setIsBatchDeleteDialogOpen(false);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(filteredProducts.map(p => p._id));
        } else {
            setSelectedIds([]);
        }
    };

    const filteredProducts = products.filter(prod => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = prod.name.toLowerCase().includes(query) ||
            prod.sku.toLowerCase().includes(query) ||
            prod.barcode?.toLowerCase().includes(query);

        let matchesCategory = true;
        if (selectedCategoryFilter !== "all") {
            const catId = prod.category?._id || prod.category;
            matchesCategory = catId === selectedCategoryFilter;
        }

        let matchesStock = true;
        if (selectedStockFilter === "in-stock") matchesStock = prod.stock > (prod.minStockLevel || 5);
        if (selectedStockFilter === "low-stock") matchesStock = prod.stock > 0 && prod.stock <= (prod.minStockLevel || 5);
        if (selectedStockFilter === "out-of-stock") matchesStock = prod.stock <= 0;

        return matchesSearch && matchesCategory && matchesStock;
    });

    const handlePrintLabel = (product) => {
        const printWindow = window.open('', '', 'width=400,height=500');
        if (!printWindow) return;

        const barcodeValue = product.barcode || product.sku;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Price Tag - ${product.sku}</title>
                    <meta charset="UTF-8">
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        * { box-sizing: border-box; }
                        body { 
                            width: 72mm; 
                            margin: 0 auto; 
                            padding: 5mm 2mm; 
                            font-family: 'Segoe UI', Arial, sans-serif; 
                            text-align: center;
                            background: #fff;
                            color: #000;
                        }
                        .label-card {
                            border: 1px solid #eee;
                            padding: 4mm;
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .brand { font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
                        .name { font-size: 13px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; line-height: 1.2; }
                        .barcode-container { margin: 4px 0; width: 100%; display: flex; justify-content: center; }
                        #barcode { width: 100%; max-height: 50px; }
                        .price-tag { font-size: 24px; font-weight: 900; margin: 6px 0; }
                        .price-tag span { font-size: 12px; font-weight: 700; vertical-align: middle; margin-right: 2px; }
                        .sku { font-size: 10px; color: #444; font-weight: 600; margin-top: 4px; }
                        @media print { 
                            .label-card { border: none; }
                            body { width: 72mm; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    <div class="label-card">
                        <div class="brand">HAPPY HANGER</div>
                        <div class="name">${product.name}</div>
                        <div class="barcode-container">
                            <svg id="barcode"></svg>
                        </div>
                        <div class="price-tag"><span>PKR</span>${product.price.toLocaleString()}</div>
                        <div class="sku">SKU: ${product.sku}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            JsBarcode("#barcode", "${barcodeValue}", {
                                format: "CODE128",
                                width: 2,
                                height: 50,
                                displayValue: true,
                                fontSize: 14,
                                margin: 0
                            });
                            setTimeout(() => { 
                                window.print(); 
                                window.onafterprint = function() { window.close(); };
                                setTimeout(() => window.close(), 1000);
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintBatchLabels = () => {
        const itemsToPrint = products.filter(p => selectedIds.includes(p._id));
        if (itemsToPrint.length === 0) return;

        const printWindow = window.open('', '', 'width=800,height=900');
        if (!printWindow) return;

        const labelsHtml = itemsToPrint.map(product => {
            const barcodeValue = product.barcode || product.sku;
            return `
                <div class="label-item">
                    <div class="label-inner">
                        <div class="brand">HAPPY HANGER</div>
                        <div class="product-title">${product.name}</div>
                        <div class="barcode-box">
                            <svg class="barcode-svg" data-value="${barcodeValue}"></svg>
                        </div>
                        <div class="price-box">PKR ${product.price.toLocaleString()}</div>
                        <div class="sku-box">SKU: ${product.sku}</div>
                    </div>
                </div>
            `;
        }).join("");

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Batch Price Tags</title>
                    <meta charset="UTF-8">
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        * { box-sizing: border-box; }
                        body { 
                            width: 72mm; 
                            margin: 0 auto; 
                            padding: 0; 
                            background: #fff;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        .label-item {
                            width: 100%;
                            page-break-after: always;
                            padding: 8mm 2mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            border-bottom: 0.5px dashed #ccc;
                        }
                        .label-inner {
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .brand { font-size: 9px; font-weight: 800; opacity: 0.7; margin-bottom: 2px; letter-spacing: 3px; }
                        .product-title { font-size: 11px; font-weight: 700; text-align: center; margin-bottom: 4px; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                        .barcode-box { width: 100%; text-align: center; margin: 2px 0; }
                        .barcode-svg { width: 100%; max-height: 40px; }
                        .price-box { font-size: 20px; font-weight: 900; margin: 4px 0; }
                        .sku-box { font-size: 9px; color: #666; font-weight: 500; }
                        @media print {
                            .label-item { border-bottom: none; }
                            body { width: 72mm; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    ${labelsHtml}
                    <script>
                        window.onload = function() {
                            document.querySelectorAll('.barcode-svg').forEach(svg => {
                                JsBarcode(svg, svg.dataset.value, {
                                    format: "CODE128",
                                    width: 1,
                                    height: 35,
                                    displayValue: false,
                                    margin: 0
                                });
                            });
                            setTimeout(() => { 
                                window.print(); 
                                window.onafterprint = function() { window.close(); };
                                setTimeout(() => window.close(), 1500);
                            }, 800);
                        };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="h-full space-y-6 p-1 animate-in fade-in duration-500 pb-40">
            <ProductStats products={products} />

            <Card className="border-stone-200 shadow-sm bg-white min-h-[500px] flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="p-4 lg:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white sticky top-0 z-30">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                                placeholder="Search by name, SKU or barcode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-stone-50/50 border-stone-200 focus:bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-stone-200 text-stone-600 gap-2 font-medium">
                                        <Filter className="w-3.5 h-3.5" />
                                        Categories: {selectedCategoryFilter === "all" ? "All" : categories.find(c => c._id === selectedCategoryFilter)?.name}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1.5">Filter by Category</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Categories</DropdownMenuRadioItem>
                                        {categories.map((cat) => (
                                            <DropdownMenuRadioItem key={cat._id} value={cat._id} className="cursor-pointer">{cat.name}</DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-stone-200 text-stone-600 gap-2 font-medium">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Stock: {selectedStockFilter === "all" ? "All" : selectedStockFilter.replace('-', ' ')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1.5">Filter by Stock</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={selectedStockFilter} onValueChange={setSelectedStockFilter}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Status</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="in-stock" className="cursor-pointer text-emerald-600">In Stock</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="low-stock" className="cursor-pointer text-amber-600">Low Stock</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="out-of-stock" className="cursor-pointer text-red-600">Out of Stock</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-stone-900 text-white hover:bg-stone-800 gap-2 whitespace-nowrap">
                                <Plus className="w-4 h-4" />
                                Add Product
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {loading ? (
                            <div className="h-48 flex flex-col items-center justify-center space-y-3">
                                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                                <span className="text-sm text-stone-500 font-medium tracking-tight">Loading inventory...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-stone-400">
                                <Search className="w-10 h-10 mb-2 opacity-20" />
                                <p className="font-medium">No products found matching your criteria.</p>
                            </div>
                        ) : (
                            <ProductTable
                                products={filteredProducts}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onSelectAll={handleSelectAll}
                                onEdit={handleEdit}
                                onDelete={(p) => { setProductToDelete(p); setIsDeleteDialogOpen(true); }}
                                onPrintLabel={handlePrintLabel}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingProduct={editingProduct}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                toast={toast}
            />

            <BatchActionBar
                selectedCount={selectedIds.length}
                onClear={() => setSelectedIds([])}
                onPrint={handlePrintBatchLabels}
                onDelete={() => setIsBatchDeleteDialogOpen(true)}
            />

            {/* Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <span className="font-bold text-stone-900">{productToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to delete <span className="font-bold text-stone-900">{selectedIds.length} products</span>. This will remove all their data permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">Delete All Selected</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
