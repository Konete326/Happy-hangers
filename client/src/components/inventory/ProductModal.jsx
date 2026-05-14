import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, Barcode as BarcodeIcon, Package, Boxes, Sparkles, RefreshCw, AlertCircle, DollarSign } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
                else if (Number(value) > Number(formData.price)) error = "Cost cannot exceed selling price";
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
        setFormData(prev => ({ ...prev, [id]: value }));
        validateField(id, value);
    };

    const generateRandomBarcode = () => {
        const randomStr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData(prev => ({ ...prev, barcode: randomStr }));
        toast?.({ title: "Barcode Generated", description: `Value: ${randomStr}` });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.size <= 2 * 1024 * 1024);

        if (validFiles.length < files.length) {
            toast?.({ title: "Image too large", description: "Standard limit is 2MB per image.", variant: "destructive" });
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), reader.result]
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
            <DialogContent className="sm:max-w-[850px] p-0 border-none shadow-2xl bg-[#fafafa] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 bg-stone-900 flex flex-row items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            {editingProduct ? <RefreshCw className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{editingProduct ? "Edit Product Details" : "Add New Inventory"}</DialogTitle>
                            <DialogDescription className="text-white/50 text-xs">Fill in the product information accurately.</DialogDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-white/50 hover:text-white hover:bg-white/10 h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <form id="product-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: IDENTIFICATION & CATEGORY */}
                        <div className="md:col-span-7 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-3 bg-stone-900 rounded-full" />
                                    General Information
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-stone-600 font-semibold text-xs pl-1">Product Title</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={cn("bg-white h-11 border-stone-200 focus:ring-1 focus:ring-stone-900", errors.name && "border-red-500")}
                                        placeholder="e.g., Premium Cotton Hoodie"
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku" className="text-stone-600 font-semibold text-xs pl-1">SKU Code</Label>
                                        <Input
                                            id="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className={cn("bg-white h-11 border-stone-200 uppercase", errors.sku && "border-red-500")}
                                            placeholder="PH-001"
                                        />
                                        {errors.sku && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.sku}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="barcode" className="text-stone-600 font-semibold text-xs pl-1">Barcode (UPC)</Label>
                                        <div className="relative group">
                                            <Input
                                                id="barcode"
                                                value={formData.barcode}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                className="bg-white h-11 border-stone-200 pr-10"
                                                placeholder="Numeric value"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={generateRandomBarcode}
                                                className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-stone-50 rounded-md text-stone-400 hover:text-stone-900 transition-colors"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-stone-600 font-semibold text-xs pl-1">Major Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => setFormData({ ...formData, category: val, subCategory: "" })}
                                        >
                                            <SelectTrigger className="bg-white h-11 border-stone-200">
                                                <SelectValue placeholder="Select one" />
                                            </SelectTrigger>
                                            <SelectContent className="border-stone-200">
                                                {parentCategories.map((cat) => (
                                                    <SelectItem key={cat._id} value={cat._id} className="cursor-pointer">{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-stone-600 font-semibold text-xs pl-1">Sub-Category</Label>
                                        <Select
                                            value={formData.subCategory}
                                            disabled={!formData.category}
                                            onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                                        >
                                            <SelectTrigger className="bg-white h-11 border-stone-200 disabled:bg-stone-50 disabled:text-stone-300">
                                                <SelectValue placeholder={formData.category ? "Select sub" : "Select main first"} />
                                            </SelectTrigger>
                                            <SelectContent className="border-stone-200">
                                                {subCategories.length > 0 ? (
                                                    subCategories.map((cat) => (
                                                        <SelectItem key={cat._id} value={cat._id} className="cursor-pointer">{cat.name}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="py-2 px-3 text-xs text-stone-400">No sub-categories available</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="description" className="text-stone-600 font-semibold text-xs pl-1">Detailed Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-white border-stone-200 min-h-[100px] resize-none focus:ring-stone-900"
                                        placeholder="Add styling notes, fabric info, or sizing details..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PRICING & STOCK */}
                        <div className="md:col-span-5 space-y-8">
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-sm">
                                <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Pricing Logic
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice" className="text-stone-500 font-medium text-[11px] uppercase">Cost Price (Purchase)</Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50 h-10 font-bold border-stone-100", errors.costPrice && "border-red-500 bg-red-50/10")}
                                        />
                                        {errors.costPrice && <p className="text-[9px] text-red-500 font-bold">{errors.costPrice}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-stone-900 font-bold text-[11px] uppercase">Selling Price (Retail)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className={cn("bg-white h-12 text-lg font-black border-stone-200", errors.price && "border-red-500")}
                                        />
                                        {errors.price && <p className="text-[9px] text-red-500 font-bold">{errors.price}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-900 text-white rounded-2xl p-6 space-y-6 shadow-xl">
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <Boxes className="w-3.5 h-3.5" />
                                    Units Management
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock" className="text-white/50 font-medium text-[11px] uppercase">Opening Stock</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className={cn("bg-white/10 border-white/10 h-10 text-white font-bold", errors.stock && "border-red-500")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minStockLevel" className="text-white/50 font-medium text-[11px] uppercase">Alert Level</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                            className="bg-white/10 border-white/10 h-10 text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <Camera className="w-3.5 h-3.5" />
                                    Product Media
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm group">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-stone-100"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 hover:bg-white hover:border-stone-900 text-stone-400 hover:text-stone-900 transition-all group"
                                    >
                                        <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black uppercase">Add Media</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
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
                            className="bg-stone-900 text-white hover:bg-stone-800 min-w-[180px] h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-stone-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
