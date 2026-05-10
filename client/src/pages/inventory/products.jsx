import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Barcode,
    DollarSign,
    Boxes,
    Camera,
    X,
    Filter,
    MoreHorizontal,
    ExternalLink,
    AlertCircle,
    ArrowUpDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Products() {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    // Filters States
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
    const [selectedStockFilter, setSelectedStockFilter] = useState("all");

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        category: "",
        price: "",
        costPrice: "",
        stock: "",
        minStockLevel: "5",
        images: []
    });

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to load categories");
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({ title: "File too large", description: "Image must be under 2MB", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, images: [...formData.images, reader.result] });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({ ...formData, images: newImages });
    };

    const generateBarcode = () => {
        const randomCode = "HH" + Math.random().toString().slice(2, 10);
        setFormData({ ...formData, barcode: randomCode });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (editingProduct) {
                await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/products/${editingProduct._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast({ title: "Success", description: "Product updated successfully" });
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/products`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
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
        }
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/products/${productToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ title: "Deleted", description: "Product removed successfully" });
            fetchProducts();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            sku: "",
            barcode: "",
            category: "",
            price: "",
            costPrice: "",
            stock: "",
            minStockLevel: "5",
            images: []
        });
        setEditingProduct(null);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || "",
            sku: product.sku,
            barcode: product.barcode || "",
            category: product.category?._id || product.category || "",
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            minStockLevel: product.minStockLevel || "5",
            images: product.images || []
        });
        setIsModalOpen(true);
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
        if (selectedStockFilter === "in-stock") matchesStock = prod.stock > prod.minStockLevel;
        if (selectedStockFilter === "low-stock") matchesStock = prod.stock > 0 && prod.stock <= prod.minStockLevel;
        if (selectedStockFilter === "out-of-stock") matchesStock = prod.stock <= 0;

        return matchesSearch && matchesCategory && matchesStock;
    });

    const openImagePreview = (imgSrc) => {
        if (!imgSrc) return;
        setPreviewImage(imgSrc);
        setIsPreviewModalOpen(true);
    };

    const handlePrintLabel = (product) => {
        const printWindow = window.open('', '', 'width=600,height=400');
        if (!printWindow) return;

        const barcodeValue = product.barcode || product.sku;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Label - ${product.sku}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; text-align: center; margin: 0; padding: 20px; display: flex; justify-content: center; }
                        .label { border: 2px dashed #000; padding: 20px; width: 300px; border-radius: 8px; }
                        .name { font-size: 18px; font-weight: bold; margin-bottom: 10px; word-wrap: break-word; }
                        .price { font-size: 16px; margin-bottom: 10px; }
                        .sku { font-size: 12px; color: #555; }
                        @media print {
                            .label { border: none; padding: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    <div class="label">
                        <div class="name">${product.name}</div>
                        <svg id="barcode"></svg>
                        <div class="price">Price: Rs. ${product.price.toLocaleString()}</div>
                        <div class="sku">SKU: ${product.sku}</div>
                    </div>
                    <script>
                        JsBarcode("#barcode", "${barcodeValue}", {
                            format: "CODE128",
                            width: 2,
                            height: 60,
                            displayValue: true,
                            fontSize: 14
                        });
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

    const getStockBadge = (stock, minLevel) => {
        if (stock <= 0) return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">Out of Stock</span>;
        if (stock <= minLevel) return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">Low Stock</span>;
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">In Stock</span>;
    };

    const validateForm = () => {
        const errs = {};

        if (formData.sku) {
            const exists = products.find(p => p.sku.toLowerCase() === formData.sku.toLowerCase() && p._id !== editingProduct?._id);
            if (exists) errs.sku = "This SKU is already in use.";
        }

        if (formData.barcode) {
            const exists = products.find(p => p.barcode?.toLowerCase() === formData.barcode.toLowerCase() && p._id !== editingProduct?._id);
            if (exists) errs.barcode = "Barcode already assigned.";
        }

        if (formData.price && Number(formData.price) <= 0) errs.price = "Invalid price.";
        if (formData.costPrice && Number(formData.costPrice) <= 0) errs.costPrice = "Invalid cost.";
        if (formData.stock && Number(formData.stock) < 0) errs.stock = "Invalid stock.";

        return errs;
    };

    const errors = validateForm();
    const isFormInvalid = Object.keys(errors).length > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Search by name, SKU, or barcode..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={selectedCategoryFilter !== "all" || selectedStockFilter !== "all" ? "default" : "outline"} className={cn("h-11 border-stone-200", (selectedCategoryFilter !== "all" || selectedStockFilter !== "all") && "bg-stone-100 text-stone-900 hover:bg-stone-200")}>
                                <Filter className="w-4 h-4 mr-2" />
                                Filters {(selectedCategoryFilter !== "all" || selectedStockFilter !== "all") && "(Active)"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border-stone-200 shadow-xl">
                            <DropdownMenuLabel>Filter by Stock</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={selectedStockFilter} onValueChange={setSelectedStockFilter}>
                                <DropdownMenuRadioItem value="all" className="cursor-pointer">All Items</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="in-stock" className="cursor-pointer">In Stock</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="low-stock" className="cursor-pointer">Low Stock</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="out-of-stock" className="cursor-pointer">Out of Stock</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                                <DropdownMenuRadioItem value="all" className="cursor-pointer">All Categories</DropdownMenuRadioItem>
                                {categories.filter(cat => !cat.parent).map(main => (
                                    <DropdownMenuRadioItem key={main._id} value={main._id} className="cursor-pointer">{main.name}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>

                            {(selectedCategoryFilter !== "all" || selectedStockFilter !== "all") && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => { setSelectedCategoryFilter("all"); setSelectedStockFilter("all"); }}
                                        className="justify-center text-red-600 focus:text-white focus:bg-red-600 font-medium cursor-pointer transition-colors"
                                    >
                                        Clear Filters
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-11 bg-stone-900 hover:bg-stone-800 text-white shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-stone-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-stone-100 rounded-xl text-stone-600">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Products</p>
                            <h3 className="text-xl font-bold text-stone-900">{products.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-stone-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Stock Value</p>
                            <h3 className="text-xl font-bold text-stone-900">
                                Rs. {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-stone-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Low Stock</p>
                            <h3 className="text-xl font-bold text-stone-900">
                                {products.filter(p => p.stock <= p.minStockLevel && p.stock > 0).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-stone-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <X className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Out of Stock</p>
                            <h3 className="text-xl font-bold text-stone-900">
                                {products.filter(p => p.stock <= 0).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-stone-100 shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-stone-50">
                        <TableRow>
                            <TableHead className="font-bold text-stone-900 w-[80px]">Image</TableHead>
                            <TableHead className="font-bold text-stone-900">Product Info</TableHead>
                            <TableHead className="font-bold text-stone-900">Category</TableHead>
                            <TableHead className="font-bold text-stone-900">Stock</TableHead>
                            <TableHead className="font-bold text-stone-900">Price</TableHead>
                            <TableHead className="text-right font-bold text-stone-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                                        <span className="text-sm text-stone-500">Loading catalog...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-stone-500">
                                        <Package className="w-10 h-10 mb-2 opacity-20" />
                                        <p>No products found in the database.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product._id} className="hover:bg-stone-50/50 transition-colors group">
                                    <TableCell>
                                        <div
                                            className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all"
                                            onClick={() => openImagePreview(product.images?.[0])}
                                        >
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                    <Camera className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-stone-900 line-clamp-1">{product.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono uppercase">SKU: {product.sku}</span>
                                                {product.barcode && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono flex items-center capitalize">
                                                        <Barcode className="w-3 h-3 mr-1" /> {product.barcode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-stone-600 px-2 py-1 bg-stone-50 border border-stone-100 rounded-md">
                                            {product.category?.name || "Uncategorized"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-bold text-stone-900">{product.stock} Units</span>
                                            {getStockBadge(product.stock, product.minStockLevel)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-stone-900">Rs. {product.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-stone-400">Cost: Rs. {product.costPrice}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="group-hover:bg-white border-transparent">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 shadow-xl border-stone-200">
                                                <DropdownMenuItem onClick={() => openEditModal(product)} className="cursor-pointer py-2 px-3">
                                                    <Edit2 className="w-4 h-4 mr-3 text-stone-500" /> Edit Product
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePrintLabel(product)} className="cursor-pointer py-2 px-3">
                                                    <Barcode className="w-4 h-4 mr-3 text-stone-500" /> Print Label
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => { setProductToDelete(product._id); setIsDeleteDialogOpen(true); }} className="cursor-pointer py-2 px-3 text-red-600 focus:text-red-700">
                                                    <Trash2 className="w-4 h-4 mr-3" /> Delete Product
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Update Product" : "Create New Product"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to {editingProduct ? "update your" : "add a new"} product to the catalog.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Display Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Premium Cotton Hanger"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU Code</Label>
                                        <Input
                                            id="sku"
                                            placeholder="SKU-001"
                                            required
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className={errors.sku ? "border-red-500" : ""}
                                        />
                                        {errors.sku && <span className="text-[10px] text-red-500 font-medium">{errors.sku}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="barcode">Barcode (Optional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="barcode"
                                                placeholder="HH-123"
                                                value={formData.barcode}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                className={errors.barcode ? "border-red-500" : ""}
                                            />
                                            <Button type="button" variant="outline" size="icon" onClick={generateBarcode} title="Generate Barcode">
                                                <Barcode className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {errors.barcode && <span className="text-[10px] text-red-500 font-medium">{errors.barcode}</span>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.filter(cat => !cat.parent).map(main => (
                                                <div key={main._id}>
                                                    <SelectItem value={main._id} className="font-bold text-stone-900">
                                                        {main.name}
                                                    </SelectItem>
                                                    {categories.filter(sub => sub.parent?._id === main._id).map(sub => (
                                                        <SelectItem key={sub._id} value={sub._id} className="pl-8 text-stone-600">
                                                            ↳ {sub.name}
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Product Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Add key features, sizes, colors..."
                                        className="h-24 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Selling Price (Rs)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            placeholder="0.00"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className={errors.price ? "border-red-500" : ""}
                                        />
                                        {errors.price && <span className="text-[10px] text-red-500 font-medium">{errors.price}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice">Cost Price (Rs)</Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            placeholder="0.00"
                                            required
                                            value={formData.costPrice}
                                            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                            className={errors.costPrice ? "border-red-500" : ""}
                                        />
                                        {errors.costPrice && <span className="text-[10px] text-red-500 font-medium">{errors.costPrice}</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">Opening Stock</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            placeholder="0"
                                            required
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            className={errors.stock ? "border-red-500" : ""}
                                        />
                                        {errors.stock && <span className="text-[10px] text-red-500 font-medium">{errors.stock}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minStockLevel">Min. Stock Level</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Images</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-lg border border-stone-200 overflow-hidden shadow-sm group">
                                                <img src={img} alt="preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="text-[10px] mt-1">Upload</span>
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </div>
                                    <p className="text-[10px] text-stone-400">Up to 2MB per image. Max 5 images.</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Discard</Button>
                            <Button type="submit" disabled={isFormInvalid} className="bg-stone-900 text-white hover:bg-stone-800 px-8 shadow-lg">
                                {editingProduct ? "Save Changes" : "Confirm & Save Product"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="border-stone-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Delete Product Catalog Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is permanent and will remove the product from your inventory records.
                            Sales history data will remain, but the product details will be inaccessible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-2">
                        <AlertDialogCancel className="border-stone-200">Stay safe, Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100">
                            Yes, Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex justify-center [&>button]:hidden">
                    {previewImage && (
                        <div className="relative inline-block">
                            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white/5" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-3 -right-3 bg-white text-stone-900 border border-stone-200 shadow-md hover:bg-stone-100 rounded-full h-8 w-8 z-50"
                                onClick={() => setIsPreviewModalOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
