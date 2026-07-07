import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera, X, Barcode as BarcodeIcon, Package, Boxes, Sparkles, RefreshCw, AlertCircle, DollarSign, Tag, Percent, Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/utils/imageCompression";
import API from "@/api/api";

export function ProductModal({
    isOpen,
    onClose,
    editingProduct,
    formData,
    setFormData,
    categories,
    onSave,
    isSubmitting,
    toast,
    fetchCategories
}) {
    const fileInputRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isPromotionOpen, setIsPromotionOpen] = useState(false);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreatingCategory(true);
        try {
            const res = await API.post("/categories", { name: newCategoryName });
            if (res.data?.data) {
                toast?.({ title: "Category Created", description: `"${newCategoryName}" created successfully.` });
                await fetchCategories();
                setFormData(prev => ({ ...prev, category: res.data.data._id }));
                setNewCategoryName("");
                setIsAddCategoryOpen(false);
            }
        } catch (err) {
            toast?.({ title: "Error", description: err.response?.data?.message || "Failed to create category", variant: "destructive" });
        } finally {
            setIsCreatingCategory(false);
        }
    };

    // Filter subcategories based on selected parent category
    const parentCategories = categories.filter(c => !c.parent);
    const subCategories = categories.filter(c => {
        const parentId = c.parent?._id || c.parent;
        return parentId && parentId.toString() === formData.category;
    });

    useEffect(() => {
        if (!isOpen) {
            setErrors({});
        }
    }, [isOpen]);


    useEffect(() => {
        if (formData.price && formData.costPrice) {
            if (Number(formData.costPrice) > Number(formData.price)) {
                setErrors(prev => ({ ...prev, costPrice: "Cost cannot exceed selling price" }));
            } else {
                setErrors(prev => ({ ...prev, costPrice: "" }));
            }
        }
    }, [formData.price, formData.costPrice]);

    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case "name":
                if (!value.trim()) error = "Product name is required";
                break;
            case "sku":
                if (!value.trim()) error = "SKU is required";
                else if (!/^[A-Z0-9-_]+$/i.test(value)) error = "Alpha-numeric only (A-Z, 0-9)";
                break;
            case "price":
                if (value === "" || isNaN(value) || Number(value) < 0) error = "Invalid price";
                break;
            case "costPrice":
                if (value === "" || isNaN(value) || Number(value) < 0) error = "Invalid cost";
                // Cross validation handled by useEffect
                break;
            case "stock":
                if (value === "" || isNaN(value) || Number(value) < 0) error = "Invalid stock";
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;

        // When price changes and there's an active sale, auto-recalculate discountPrice
        if (id === "price" && formData.onSale && formData.discountPercentage) {
            const newDiscountPrice = Math.round(Number(value) * (1 - (Number(formData.discountPercentage) / 100)));
            setFormData(prev => ({ ...prev, price: value, discountPrice: newDiscountPrice }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }

        validateField(id, value);
    };

    const generateRandomBarcode = () => {
        const randomStr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData(prev => ({ ...prev, barcode: randomStr }));
    };

    const handleImageChange = (e) => {
        const currentCount = formData.images?.length || 0;
        if (currentCount >= 3) {
            toast?.({ title: "Limit Reached", description: "You can only upload up to 3 images.", variant: "destructive" });
            return;
        }

        const files = Array.from(e.target.files);
        const remainingSlots = 3 - currentCount;
        const filesToProcess = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            toast?.({ title: "Partial Upload", description: `Only ${remainingSlots} more image(s) allowed.` });
        }

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                // Compress before saving to state
                const compressed = await compressImage(base64, 800, 0.7);
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), compressed]
                }));
            };
            reader.readAsDataURL(file);
        });
    };


    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();

        // Final validation check
        const isNameValid = validateField("name", formData.name);
        const isSkuValid = validateField("sku", formData.sku);
        const isPriceValid = validateField("price", formData.price);
        const isCostPriceValid = validateField("costPrice", formData.costPrice);
        const isStockValid = validateField("stock", formData.stock);

        if (isNameValid && isSkuValid && isPriceValid && isCostPriceValid && isStockValid && formData.category) {
            onSave(e);
        } else if (!formData.category) {
            toast?.({ title: "Missing Category", description: "Please select a primary category.", variant: "destructive" });
        }
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="sm:max-w-[850px] p-0 border-none shadow-2xl bg-[#f8f6f2] rounded-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <DialogHeader className="p-4 bg-[#1c1a17] text-white shrink-0 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full z-50"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            {editingProduct ? <RefreshCw className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{editingProduct ? "Edit Product Details" : "Add New Inventory"}</DialogTitle>
                            <DialogDescription className="text-white/50 text-xs">Fill in the product information accurately.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 bg-[#faf8f5]">
                    <form id="product-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">

                        {/* LEFT COLUMN: IDENTITY & CONTENT */}
                        <div className="lg:col-span-7 space-y-2.5">

                            {/* SECTION: BASIC INFO */}
                            <div className="bg-white rounded-xl border border-stone-100 p-2.5 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-1.5 mb-0.5">
                                    <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center text-white">
                                        <Package className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Identity & Details</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="name" className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">Product Title <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50/50 h-8 border-stone-200 focus:bg-white text-sm font-semibold", errors.name && "border-red-500")}
                                            placeholder="Enter name..."
                                        />
                                        {errors.name && <p className="text-[9px] text-red-500 font-bold px-1">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="sku" className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">SKU / Item Code <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50/50 h-8 border-stone-200 uppercase font-mono text-sm", errors.sku && "border-red-500")}
                                            placeholder="SKU-XXXX"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="barcode" className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">Barcode (EAN/UPC)</Label>
                                        <div className="relative">
                                            <Input
                                                id="barcode"
                                                value={formData.barcode}
                                                onChange={handleInputChange}
                                                className="bg-stone-50/50 h-8 border-stone-200 pr-10 font-mono text-sm"
                                                placeholder="Scan or generate"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={generateRandomBarcode}
                                                className="absolute right-0 top-0 h-full w-9 p-0 text-stone-400 hover:text-stone-900 flex items-center justify-center bg-transparent hover:bg-transparent"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="description" className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">Description / Story</Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="bg-stone-50/50 border-stone-200 h-8 focus:bg-white text-xs font-medium"
                                            placeholder="Enter brief description..."
                                        />
                                    </div>
                                </div>
                            </div>

                             <div className="bg-white rounded-xl border border-stone-100 p-2.5 shadow-sm space-y-2 relative">
                                 <div className="flex items-center justify-between border-b border-stone-50 pb-1.5 mb-0.5">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                                             <Boxes className="w-3 h-3" />
                                         </div>
                                         <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Categorization</h3>
                                     </div>
                                     <Button
                                         type="button"
                                         variant="outline"
                                         size="icon"
                                         onClick={() => setIsAddCategoryOpen(true)}
                                         className="h-7 w-7 bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 shrink-0"
                                     >
                                         <Plus className="w-3.5 h-3.5" />
                                     </Button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-1.5">
                                         <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">Primary Category <span className="text-red-500">*</span></Label>
                                         <Select
                                             value={formData.category}
                                             onValueChange={(val) => setFormData({ ...formData, category: val, subCategory: "" })}
                                         >
                                             <SelectTrigger className="bg-stone-50/50 h-8 border-stone-200 font-medium text-sm">
                                                 <SelectValue placeholder="Select Category" />
                                             </SelectTrigger>
                                             <SelectContent className="border-stone-100">
                                                 {parentCategories.map((cat) => (
                                                     <SelectItem key={cat._id} value={cat._id} className="font-medium">{cat.name}</SelectItem>
                                                 ))}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                     <div className="space-y-1.5">
                                         <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 pl-1">Sub-Category</Label>
                                         <Select
                                             value={formData.subCategory}
                                             disabled={!formData.category}
                                             onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                                         >
                                             <SelectTrigger className="bg-stone-50/50 h-8 border-stone-200 font-medium disabled:opacity-30 text-sm">
                                                 <SelectValue placeholder={formData.category ? "Select Sub" : "Select main first"} />
                                             </SelectTrigger>
                                             <SelectContent className="border-stone-100">
                                                 {subCategories.length > 0 ? (
                                                     subCategories.map((cat) => (
                                                         <SelectItem key={cat._id} value={cat._id} className="font-medium">{cat.name}</SelectItem>
                                                     ))
                                                 ) : (
                                                     <div className="py-6 text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">No Sub-items</div>
                                                 )}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div className="lg:col-span-5 space-y-3">
                            <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-1.5 mb-0.5">
                                    <div className="w-5 h-5 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                                        <Camera className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-stone-900 uppercase tracking-tight">Gallery</h3>
                                </div>

                                {formData.images && formData.images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mb-1.5">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg border border-stone-100 overflow-hidden bg-stone-50 group hover:border-red-500 transition-colors">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(formData.images?.length || 0) < 3 && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer bg-stone-50 hover:bg-stone-100/80 transition-all py-2 px-3 rounded-lg border-2 border-dashed border-stone-300 hover:border-stone-400 flex flex-col items-center justify-center gap-0.5 text-center"
                                    >
                                        <svg className="w-5 h-5 text-stone-600" viewBox="0 0 640 512" fill="currentColor">
                                            <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
                                        </svg>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Drag & Drop or click</span>
                                            <span className="bg-stone-700 hover:bg-stone-900 px-2 py-0.5 rounded text-white font-bold text-[8px] uppercase tracking-wider transition-all mt-0.5">Browse file</span>
                                        </div>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                <p className="text-[8px] text-stone-400 font-bold uppercase text-center tracking-tighter mt-0.5">Up to 3 shots allowed</p>
                            </div>

                             <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-white rounded-xl border border-stone-100 p-2.5 shadow-sm space-y-2.5">
                                     <div className="flex items-center gap-1.5 border-b border-stone-50 pb-1.5 mb-0.5">
                                         <div className="w-5 h-5 rounded-md bg-stone-900 flex items-center justify-center text-white shrink-0">
                                             <DollarSign className="w-3 h-3" />
                                         </div>
                                         <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-tight truncate">Financing</h3>
                                     </div>

                                     <div className="space-y-2">
                                         <div className="flex items-center justify-between gap-1.5">
                                             <Label htmlFor="price" className="text-[9px] font-bold uppercase tracking-wider text-stone-900 shrink-0">Price</Label>
                                             <div className="relative flex-1 max-w-[90px]">
                                                 <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-stone-400">Rs</span>
                                                 <Input
                                                     id="price"
                                                     type="number"
                                                     value={formData.price}
                                                     onChange={handleInputChange}
                                                     className={cn("pl-6 h-7 bg-stone-50 border-stone-200 text-xs font-black text-stone-900 text-right pr-1.5", errors.price && "border-red-500")}
                                                 />
                                             </div>
                                         </div>

                                         <div className="flex items-center justify-between gap-1.5">
                                             <Label htmlFor="costPrice" className="text-[9px] font-bold uppercase tracking-wider text-stone-400 shrink-0">Cost</Label>
                                             <Input
                                                 id="costPrice"
                                                 type="number"
                                                 value={formData.costPrice}
                                                 onChange={handleInputChange}
                                                 className={cn("bg-stone-50/30 h-7 border-stone-100 font-bold text-stone-600 text-xs flex-1 max-w-[90px] text-right px-1.5", errors.costPrice && "border-red-500")}
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 <div className="bg-stone-900 text-white rounded-xl p-2.5 shadow-xl space-y-2.5">
                                     <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-0.5">
                                         <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0">
                                             <AlertCircle className="w-3 h-3" />
                                         </div>
                                         <h3 className="text-[10px] font-bold uppercase tracking-tight truncate">Inventory</h3>
                                     </div>

                                     <div className="space-y-2">
                                         <div className="flex items-center justify-between gap-1.5">
                                             <Label htmlFor="stock" className="text-[9px] font-bold uppercase tracking-wider text-white/50 shrink-0">Qty</Label>
                                             <Input
                                                 id="stock"
                                                 type="number"
                                                 value={formData.stock}
                                                 onChange={handleInputChange}
                                                 className="bg-white/10 border-white/10 h-7 text-white font-black text-xs flex-1 max-w-[70px] text-right px-1.5 focus:bg-white/20"
                                             />
                                         </div>
                                         <div className="flex items-center justify-between gap-1.5">
                                             <Label htmlFor="minStockLevel" className="text-[9px] font-bold uppercase tracking-wider text-white/50 shrink-0">Alert</Label>
                                             <Input
                                                 id="minStockLevel"
                                                 type="number"
                                                 value={formData.minStockLevel}
                                                 onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                                 className="bg-white/10 border-white/10 h-7 text-white font-bold text-xs flex-1 max-w-[70px] text-right px-1.5 focus:bg-white/20"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                            
                            <div className={cn(
                                "rounded-xl border p-3 flex items-center justify-between transition-all duration-300 relative",
                                formData.onSale ? "bg-emerald-50 border-emerald-100 shadow-emerald-50 shadow-sm" : "bg-white border-stone-100 shadow-sm"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", formData.onSale ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400")}>
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className={cn("text-[10px] font-black uppercase tracking-widest", formData.onSale ? "text-emerald-800" : "text-stone-500")}>Promotional Sale</h3>
                                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">
                                            {formData.onSale ? `Active: ${formData.discountPercentage}% off ${formData.saleLabel ? `(${formData.saleLabel})` : ""}` : "No promotion active"}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsPromotionOpen(true)}
                                    className={cn("h-7 w-7 rounded-md shrink-0 border", formData.onSale ? "bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200" : "bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900")}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </Button>
                            </div>


                        </div>
                    </form>
                </div>

                <DialogFooter className="p-4 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 font-bold text-xs uppercase tracking-widest"
                    >
                        Discard Changes
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting || Object.values(errors).some(e => e)}
                            className="bg-stone-900 text-white hover:bg-stone-800 min-w-[150px] h-10 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-stone-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Package className="w-4 h-4" />
                                    {editingProduct ? "Update Product" : "Save Product"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogContent className="sm:max-w-sm bg-[#faf8f5] border-stone-200">
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new primary category for products.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="newCategoryName">Category Name</Label>
                            <Input
                                id="newCategoryName"
                                placeholder="e.g. Shirts, Pants..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
                            {isCreatingCategory ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isPromotionOpen} onOpenChange={setIsPromotionOpen}>
                <DialogContent className="sm:max-w-md bg-[#faf8f5] border-stone-200">
                    <DialogHeader>
                        <DialogTitle>Configure Promotion</DialogTitle>
                        <DialogDescription>Apply a promotional discount percentage and label to this item.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-stone-700">Enable Discount</span>
                                <span className="text-[10px] text-stone-400">Toggle to make product on-sale</span>
                            </div>
                            <Switch
                                id="onSale"
                                checked={formData.onSale}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, onSale: checked }))}
                            />
                        </div>

                        {formData.onSale && (
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <Label htmlFor="discountPercentage" className="text-[10px] font-bold uppercase text-emerald-700">Discount Rate (%)</Label>
                                        {formData.price && formData.discountPrice && (
                                            <span className="text-[9px] font-black text-emerald-600 uppercase">Saving: Rs. {(Number(formData.price || 0) - Number(formData.discountPrice || 0)).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                        <Input
                                            id="discountPercentage"
                                            type="number"
                                            value={formData.discountPercentage || Math.round((1 - (Number(formData.discountPrice || 0) / Number(formData.price || 1))) * 100) || ""}
                                            onChange={(e) => {
                                                const pct = e.target.value;
                                                const calculatedPrice = formData.price ? Math.round(formData.price * (1 - (pct / 100))) : 0;
                                                setFormData(prev => ({ ...prev, discountPercentage: pct, discountPrice: calculatedPrice }));
                                            }}
                                            className="bg-white border-emerald-200 h-9 pl-10 text-emerald-900 font-black text-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                    {Number(formData.discountPrice || 0) > 0 && (
                                        <p className="mt-2 text-[10px] text-emerald-600 font-bold uppercase text-center tracking-widest bg-white py-1 rounded-lg border border-emerald-100">
                                            Final Sale Price: <span className="text-sm">Rs. {Number(formData.discountPrice || 0).toLocaleString()}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="saleLabel" className="text-[10px] font-bold uppercase text-stone-500">Sale Tag (e.g. Clearance)</Label>
                                    <Input
                                        id="saleLabel"
                                        value={formData.saleLabel}
                                        onChange={handleInputChange}
                                        className="bg-white border-stone-200 h-9 text-xs font-bold text-stone-900"
                                        placeholder="Winter Offer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                     <DialogFooter>
                         <Button
                             className="bg-stone-900 text-white hover:bg-stone-800"
                             onClick={() => {
                                 const numPct = Number(formData.discountPercentage);
                                 if (!formData.discountPercentage || isNaN(numPct) || numPct <= 0) {
                                     setFormData(prev => ({ ...prev, onSale: false, discountPercentage: "", discountPrice: "" }));
                                 }
                                 setIsPromotionOpen(false);
                             }}
                         >
                             Done
                         </Button>
                     </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Minimalist local icon for the modal trigger inside header
function PlusCircle({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
        </svg>
    )
}
