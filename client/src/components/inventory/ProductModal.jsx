import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera, X, Barcode as BarcodeIcon, Package, Boxes, Sparkles, RefreshCw, AlertCircle, DollarSign, Tag, Percent } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/utils/imageCompression";

export function ProductModal({
    isOpen,
    onClose,
    editingProduct,
    formData,
    setFormData,
    categories,
    onSave,
    isSubmitting,
    toast
}) {
    const fileInputRef = useRef(null);
    const [errors, setErrors] = useState({});

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
        toast?.({ title: "Barcode Generated", description: `Value: ${randomStr}` });
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="sm:max-w-[850px] p-0 border-none shadow-2xl bg-[#fafafa] rounded-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <DialogHeader className="p-4 bg-stone-900 text-white shrink-0 relative">
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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#fdfdfd]">
                    <form id="product-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* LEFT COLUMN: IDENTITY & CONTENT */}
                        <div className="lg:col-span-7 space-y-3">

                            {/* SECTION: BASIC INFO */}
                            <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-1">
                                    <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center text-white">
                                        <Package className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Identity & Details</h3>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Product Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={cn("bg-stone-50/50 h-9 border-stone-200 focus:bg-white text-sm font-semibold", errors.name && "border-red-500")}
                                        placeholder="Enter product name..."
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold px-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">SKU / Item Code <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50/50 h-9 border-stone-200 uppercase font-mono text-sm", errors.sku && "border-red-500")}
                                            placeholder="SKU-XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="barcode" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Barcode (EAN/UPC)</Label>
                                        <div className="relative">
                                            <Input
                                                id="barcode"
                                                value={formData.barcode}
                                                onChange={handleInputChange}
                                                className="bg-stone-50/50 h-9 border-stone-200 pr-10 font-mono text-sm"
                                                placeholder="Scan or generate"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={generateRandomBarcode}
                                                className="absolute right-1 top-1 h-9 w-9 p-0 text-stone-400 hover:text-stone-900"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Product Story / Specs</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-stone-50/50 border-stone-200 min-h-[60px] resize-none focus:bg-white text-xs"
                                        placeholder="Describe the product features, material, or size guide..."
                                    />
                                </div>
                            </div>

                            {/* SECTION: CATEGORIZATION */}
                            <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-1">
                                    <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                                        <Boxes className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Categorization</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Primary Category <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => setFormData({ ...formData, category: val, subCategory: "" })}
                                        >
                                            <SelectTrigger className="bg-stone-50/50 h-9 border-stone-200 font-medium text-sm">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent className="border-stone-100">
                                                {parentCategories.map((cat) => (
                                                    <SelectItem key={cat._id} value={cat._id} className="font-medium">{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Sub-Category</Label>
                                        <Select
                                            value={formData.subCategory}
                                            disabled={!formData.category}
                                            onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                                        >
                                            <SelectTrigger className="bg-stone-50/50 h-9 border-stone-200 font-medium disabled:opacity-30 text-sm">
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

                        {/* RIGHT COLUMN: FINANCIALS, STOCK & MEDIA */}
                        <div className="lg:col-span-5 space-y-3">

                            {/* SECTION: PRICING */}
                            <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-1">
                                    <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center text-white">
                                        <DollarSign className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Financing</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest text-stone-900 pl-1">Selling Price (Retails) <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">PKR</span>
                                            <Input
                                                id="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className={cn("pl-12 h-10 bg-stone-50 border-stone-200 focus:bg-white text-lg font-black text-stone-900", errors.price && "border-red-500")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-1">Cost Price (Purchase) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50/30 h-9 border-stone-100 font-bold text-stone-600 text-sm", errors.costPrice && "border-red-500")}
                                        />
                                        {errors.costPrice && <p className="text-[10px] text-red-500 font-bold px-1">{errors.costPrice}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: STOCK & ALERT */}
                            <div className="bg-stone-900 text-white rounded-xl p-4 shadow-xl space-y-3">
                                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
                                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white">
                                        <AlertCircle className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-tight">Inventory Control</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock" className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-1">Available Qty <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className="bg-white/10 border-white/10 h-9 text-white font-black text-sm focus:bg-white/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minStockLevel" className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-1">Alert Level</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                            className="bg-white/10 border-white/10 h-9 text-white font-bold text-sm focus:bg-white/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: SALE TOGGLE */}
                            <div className={cn(
                                "rounded-xl border p-4 space-y-3 transition-all duration-300",
                                formData.onSale ? "bg-emerald-50 border-emerald-100 shadow-emerald-50 shadow-lg" : "bg-white border-stone-100 shadow-sm"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", formData.onSale ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400")}>
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className={cn("text-xs font-black uppercase tracking-widest", formData.onSale ? "text-emerald-800" : "text-stone-400")}>Promotional Sale</h3>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">Toggle to set discount</p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="onSale"
                                        checked={formData.onSale}
                                        onCheckedChange={(checked) => setFormData({ ...formData, onSale: checked })}
                                    />
                                </div>

                                {formData.onSale && (
                                    <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1.5 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                            <div className="flex items-center justify-between mb-1">
                                                <Label htmlFor="discountPercentage" className="text-[10px] font-bold uppercase text-emerald-700">Discount Rate (%)</Label>
                                                {formData.price && formData.discountPrice && (
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Saving: Rs. {(formData.price - formData.discountPrice).toLocaleString()}</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                <Input
                                                    id="discountPercentage"
                                                    type="number"
                                                    value={formData.discountPercentage || Math.round((1 - (formData.discountPrice / formData.price)) * 100) || ""}
                                                    onChange={(e) => {
                                                        const pct = e.target.value;
                                                        const calculatedPrice = formData.price ? Math.round(formData.price * (1 - (pct / 100))) : 0;
                                                        setFormData({ ...formData, discountPercentage: pct, discountPrice: calculatedPrice });
                                                    }}
                                                    className="bg-white border-emerald-200 h-9 pl-10 text-emerald-900 font-black text-lg"
                                                    placeholder="0"
                                                />
                                            </div>
                                            {formData.discountPrice > 0 && (
                                                <p className="mt-2 text-[10px] text-emerald-600 font-bold uppercase text-center tracking-widest bg-white/50 py-1 rounded-lg border border-emerald-100">
                                                    Final Sale Price: <span className="text-sm">Rs. {formData.discountPrice.toLocaleString()}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="saleLabel" className="text-[10px] font-bold uppercase text-emerald-700/60">Sale Tag (e.g. Clearance)</Label>
                                            <Input
                                                id="saleLabel"
                                                value={formData.saleLabel}
                                                onChange={handleInputChange}
                                                className="bg-white border-emerald-200 h-9 text-xs font-bold text-emerald-900"
                                                placeholder="Winter Offer"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SECTION: MEDIA */}
                            <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-1">
                                    <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                                        <Camera className="w-3 h-3" />
                                    </div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-tight">Gallary</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl border border-stone-100 overflow-hidden bg-stone-50 group hover:border-red-500 transition-colors">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {(formData.images?.length || 0) < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-400 text-stone-400 transition-all"
                                        >
                                            <PlusCircle className="w-6 h-6 opacity-30" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Add Media</span>
                                        </button>
                                    )}
                                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </div>
                                <p className="text-[9px] text-stone-400 font-bold uppercase text-center tracking-tighter">Up to 3 high-quality shots allowed</p>
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
