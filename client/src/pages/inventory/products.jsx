import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, AlertCircle, Tag, Printer } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import API from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import logoImg from "@/assets/logo-removebg-preview.png";

// Modular Components
import { ProductStats } from "@/components/inventory/ProductStats";
import { ProductTable } from "@/components/inventory/ProductTable";
import { ProductModal } from "@/components/inventory/ProductModal";
import { BulkSaleModal } from "@/components/inventory/BulkSaleModal";
import { BatchActionBar } from "@/components/inventory/BatchActionBar";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";


export default function Products() {
    const { user } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
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
    const [isBulkSaleOpen, setIsBulkSaleOpen] = useState(false);
    const [selectedPrintProduct, setSelectedPrintProduct] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!isPrintModalOpen) {
            setIsPrinting(false);
        }
    }, [isPrintModalOpen]);

    const triggerPrintAnimation = () => {
        if (isPrinting) return;
        setIsPrinting(true);
        setTimeout(() => {
            executePrintLabel(selectedPrintProduct);
        }, 1500);
        setTimeout(() => {
            setIsPrinting(false);
        }, 4000);
    };

    // Filters States
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
    const [selectedStockFilter, setSelectedStockFilter] = useState("all");

    // Pagination States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        if (location.state?.stockFilter) {
            setSelectedStockFilter(location.state.stockFilter);
            // Clear the state so it doesn't re-apply if user navigates back
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

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
        images: [],
        onSale: false,
        discountPercentage: "",
        discountPrice: "",
        saleLabel: ""
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 25,
                search: debouncedSearch,
                category: selectedCategoryFilter,
                stockStatus: selectedStockFilter
            };
            const response = await API.get("/products", { params });
            setProducts(response.data.data);
            setTotalPages(response.data.pages);
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
    }, [debouncedSearch, selectedCategoryFilter, selectedStockFilter, page]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategoryFilter, selectedStockFilter]);


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
            images: [],
            onSale: false,
            discountPercentage: "",
            discountPrice: "",
            saleLabel: ""
        });
        setEditingProduct(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        // Strict Validation: Ensure all Mongoose required fields are present and valid
        const requiredFields = ['name', 'sku', 'category', 'price', 'costPrice', 'stock'];
        const missingFields = requiredFields.filter(f => !formData[f] && formData[f] !== 0);

        if (missingFields.length > 0) {
            toast({
                title: "Incomplete Data",
                description: `Please fill in: ${missingFields.join(', ')}`,
                variant: "destructive"
            });
            return;
        }

        // Sanitize numbers and IDs
        const payload = {
            ...formData,
            price: Number(formData.price),
            costPrice: Number(formData.costPrice),
            stock: Number(formData.stock),
            minStockLevel: Number(formData.minStockLevel) || 5,
            subCategory: formData.subCategory || null,
        };

        setIsSubmitting(true);
        try {
            if (editingProduct) {
                await API.patch(`/products/${editingProduct._id}`, payload);
                toast({ title: "Updated ✓", description: `${formData.name} updated successfully.` });
            } else {
                await API.post("/products", payload);
                toast({ title: "Product Added ✓", description: `${formData.name} is now in inventory.` });
            }
            setIsModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            const rawMsg = error.response?.data?.message || "";
            let friendlyMsg = "Something went wrong. Please try again.";
            if (rawMsg.includes("Cast to ObjectId")) friendlyMsg = "Invalid category selection.";
            else if (rawMsg.includes("duplicate key") || rawMsg.includes("sku")) friendlyMsg = "SKU must be unique.";
            else if (rawMsg) friendlyMsg = rawMsg;

            toast({ title: "Could Not Save", description: friendlyMsg, variant: "destructive" });
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
            images: product.images || [],
            onSale: product.onSale || false,
            discountPrice: product.discountPrice || "",
            discountPercentage: product.discountPrice ? Math.round((1 - (product.discountPrice / product.price)) * 100) : "",
            saleLabel: product.saleLabel || ""
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
        if (selectedIds.length === 0) return;
        try {
            await API.post("/products/batch-delete", { productIds: selectedIds });
            toast({ title: "Batch Deleted", description: `${selectedIds.length} products removed.` });
            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            toast({ title: "Operation Failed", description: "Batch deletion failed on server.", variant: "destructive" });
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

    const filteredProducts = products; // Backend now handles filtering

    const handlePrintLabel = (product) => {
        setSelectedPrintProduct(product);
        setIsPrintModalOpen(true);
    };

    const executePrintLabel = (product) => {
        if (!product) return;
        const isElectron = window.process && window.process.versions && window.process.versions.electron;
        const barcodeValue = product.barcode || product.sku;

        const printScript = isElectron ? `
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
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
                        };
                    </script>
        ` : `
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
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
        `;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Price Tag - ${product.sku}</title>
                    <meta charset="UTF-8">
                    <style>
                        @page { size: 80mm 297mm; margin: 0; }
                        * { box-sizing: border-box; }
                        body { 
                            width: 72mm; 
                            margin: 0; 
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
                            body { width: 72mm; margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="label-card">
                        ${logoImg ? `<img src="${logoImg}" style="max-height: 20px; margin-bottom: 2px;" />` : ''}
                        <div class="brand">${(user?.brandName || "HAPPY HANGERS").toUpperCase()}</div>
                        <div class="name">${product.name}</div>
                        <div class="barcode-container">
                            <svg id="barcode"></svg>
                        </div>
                        <div class="price-tag"><span>PKR</span>${product.price.toLocaleString()}</div>
                        <div class="sku">SKU: ${product.sku}</div>
                    </div>
                    ${printScript}
                </body>
            </html>
        `;

        if (isElectron) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('print-receipt', html);
        } else {
            const printWindow = window.open('', '', 'width=400,height=500');
            if (!printWindow) return;
            printWindow.document.write(html);
            printWindow.document.close();
        }
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
                        ${user?.logo ? `<img src="${user.logo}" style="max-height: 20px; margin-bottom: 2px;" />` : ''}
                        <div class="brand">${(user?.brandName || "HAPPY HANGERS").toUpperCase()}</div>
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
                        @page { 
                            size: A4; 
                            margin: 10mm; 
                        }
                        * { box-sizing: border-box; }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: #fff;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        .labels-grid {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 5mm;
                            width: 100%;
                        }
                        .label-item {
                            width: 100%;
                            padding: 6mm 2mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            border: 0.1mm solid #eee;
                            border-radius: 2mm;
                            page-break-inside: avoid;
                        }
                        .label-inner {
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .brand { font-size: 8px; font-weight: 800; opacity: 0.5; margin-bottom: 2px; letter-spacing: 2px; }
                        .product-title { font-size: 10px; font-weight: 700; text-align: center; margin-bottom: 4px; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                        .barcode-box { width: 100%; text-align: center; margin: 2px 0; }
                        .barcode-svg { width: 100%; max-height: 35px; }
                        .price-box { font-size: 16px; font-weight: 900; margin: 4px 0; }
                        .sku-box { font-size: 8px; color: #888; font-weight: 500; }
                        @media print {
                            .label-item { border: 0.1mm solid #f0f0f0; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    <div class="labels-grid">
                        ${labelsHtml}
                    </div>
                    <script>
                        window.onload = function() {
                            document.querySelectorAll('.barcode-svg').forEach(svg => {
                                JsBarcode(svg, svg.dataset.value, {
                                    format: "CODE128",
                                    width: 1,
                                    height: 30,
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
            <ProductStats products={products} onFilterSelect={(filterId) => setSelectedStockFilter(filterId)} />

            <Card className="border-stone-200 shadow-sm bg-white min-h-[500px] flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="p-4 lg:p-6 border-b border-stone-100 bg-white sticky top-0 z-30">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-12 md:col-span-4 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <Input
                                    placeholder="Search by name, SKU or barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-stone-50/50 border-stone-200 focus:bg-white w-full"
                                />
                            </div>
                            
                            <div className="col-span-12 md:col-span-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full border-stone-200 text-stone-600 gap-2 font-medium">
                                            <Filter className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Categories: {selectedCategoryFilter === "all" ? "All" : categories.find(c => c._id === selectedCategoryFilter)?.name}</span>
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
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full border-stone-200 text-stone-600 gap-2 font-medium">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Stock: {selectedStockFilter === "all" ? "All" : selectedStockFilter.replace('-', ' ')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-1">
                                        <DropdownMenuLabel className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1.5">Filter by Stock</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={selectedStockFilter} onValueChange={setSelectedStockFilter}>
                                            <DropdownMenuRadioItem value="all" className="cursor-pointer">All Status</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="in-stock" className="cursor-pointer text-emerald-600">In Stock</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="low-stock" className="cursor-pointer text-amber-600">Low Stock</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="out-of-stock" className="cursor-pointer text-red-600">Out of Stock</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="on-sale" className="cursor-pointer text-emerald-600">On Sale</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <Button
                                    onClick={() => setIsBulkSaleOpen(true)}
                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-100"
                                >
                                    <Tag className="w-4 h-4 shrink-0" />
                                    <span className="truncate">Bulk Sale</span>
                                </Button>
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full bg-stone-900 text-white hover:bg-stone-800 gap-2">
                                    <Plus className="w-4 h-4 shrink-0" />
                                    <span className="truncate">Add Product</span>
                                </Button>
                            </div>
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

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-stone-100 bg-stone-50/30">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="gap-1 pl-2.5"
                                        >
                                            <PaginationPrevious className="h-4 w-4" />
                                            <span>Previous</span>
                                        </Button>
                                    </PaginationItem>

                                    <div className="flex items-center gap-1 mx-2">
                                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                                            Page {page} of {totalPages}
                                        </span>
                                    </div>

                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="gap-1 pr-2.5"
                                        >
                                            <span>Next</span>
                                            <PaginationNext className="h-4 w-4" />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}

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
                fetchCategories={fetchCategories}
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

            <BulkSaleModal
                isOpen={isBulkSaleOpen}
                onClose={() => setIsBulkSaleOpen(false)}
                products={products}
                fetchProducts={fetchProducts}
                toast={toast}
            />

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

            <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Print Price Tag</DialogTitle>
                        <DialogDescription>Preview the price tag before sending it to the printer.</DialogDescription>
                    </DialogHeader>

                    {selectedPrintProduct && (
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
                                    <div className="receipt" style={{ minHeight: '130px', gap: '0.5em', padding: '12px' }}>
                                        <div className="receipt-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', borderBottom: 'none' }}>
                                            <img src={logoImg} alt="Logo" style={{ maxHeight: '25px', objectFit: 'contain', marginBottom: '2px' }} />
                                            <div style={{ fontWeight: 'bold', fontSize: '9px', letterSpacing: '1px' }}>{(user?.brandName || "HAPPY HANGERS").toUpperCase()}</div>
                                        </div>
                                        
                                        <div className="receipt-subheader font-bold uppercase text-center" style={{ fontSize: '10px', borderBottom: 'none', borderTop: 'none', margin: '2px 0', padding: '0', justifyContent: 'center' }}>
                                            {selectedPrintProduct.name}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                                            <svg className="w-40 h-8 text-black" viewBox="0 0 100 20" style={{ shapeRendering: 'crispEdges' }}>
                                                <rect x="2" width="2" height="20" fill="currentColor" />
                                                <rect x="6" width="1" height="20" fill="currentColor" />
                                                <rect x="9" width="3" height="20" fill="currentColor" />
                                                <rect x="14" width="1.5" height="20" fill="currentColor" />
                                                <rect x="17" width="2.5" height="20" fill="currentColor" />
                                                <rect x="21" width="1" height="20" fill="currentColor" />
                                                <rect x="24" width="4" height="20" fill="currentColor" />
                                                <rect x="30" width="1.5" height="20" fill="currentColor" />
                                                <rect x="33" width="2" height="20" fill="currentColor" />
                                                <rect x="37" width="1" height="20" fill="currentColor" />
                                                <rect x="40" width="3" height="20" fill="currentColor" />
                                                <rect x="45" width="2.5" height="20" fill="currentColor" />
                                                <rect x="49" width="1" height="20" fill="currentColor" />
                                                <rect x="52" width="3" height="20" fill="currentColor" />
                                                <rect x="57" width="1.5" height="20" fill="currentColor" />
                                                <rect x="60" width="2" height="20" fill="currentColor" />
                                                <rect x="64" width="1" height="20" fill="currentColor" />
                                                <rect x="67" width="4" height="20" fill="currentColor" />
                                                <rect x="73" width="1.5" height="20" fill="currentColor" />
                                                <rect x="76" width="2" height="20" fill="currentColor" />
                                                <rect x="80" width="1" height="20" fill="currentColor" />
                                                <rect x="83" width="3" height="20" fill="currentColor" />
                                                <rect x="88" width="2.5" height="20" fill="currentColor" />
                                                <rect x="92" width="1" height="20" fill="currentColor" />
                                                <rect x="95" width="3" height="20" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div className="text-center font-mono" style={{ fontSize: '8px', color: '#666', marginTop: '-2px' }}>
                                            {selectedPrintProduct.barcode || selectedPrintProduct.sku}
                                        </div>

                                        <div className="text-center font-black" style={{ fontSize: '18px', margin: '4px 0 0 0' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>PKR</span>
                                            {selectedPrintProduct.price.toLocaleString()}
                                        </div>
                                        <div className="text-center text-stone-500 font-bold" style={{ fontSize: '8px', marginTop: '2px' }}>
                                            SKU: {selectedPrintProduct.sku}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Close</Button>
                        <Button className="bg-stone-900 text-white hover:bg-stone-800" onClick={triggerPrintAnimation} disabled={isPrinting}>
                            <Printer className="w-4 h-4 mr-2" /> {isPrinting ? "Printing..." : "Print Tag"}
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
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZg/+Luzg/FjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==);
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
