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
    const subCategories = categories.filter(c => c.parent === formData.category);

    useEffect(() => {
        if (!isOpen) {
            setErrors({});
        }
    }, [isOpen]);

    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case "name":
                if (!value.trim()) error = "Name is required";
                break;
            case "sku":
                if (!value.trim()) error = "SKU is required";
                else if (!/^[A-Z0-9-_]+$/i.test(value)) error = "Invalid SKU format (Alphanumeric only)";
                break;
            case "price":
                if (!value || isNaN(value) || Number(value) < 0) error = "Invalid price";
                break;
            case "costPrice":
                if (!value || isNaN(value) || Number(value) < 0) error = "Invalid cost price";
                else if (Number(value) > Number(formData.price)) error = "Cost price > Selling price";
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
        toast?.({ title: "Barcode Generated", description: `Assigned: ${randomStr}` });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.size <= 2 * 1024 * 1024);

        if (validFiles.length < files.length) {
            alert("Some files exceed 2MB and were skipped.");
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
        e.preventDefault();

        // Final validation check
        const isNameValid = validateField("name", formData.name);
        const isSkuValid = validateField("sku", formData.sku);
        const isPriceValid = validateField("price", formData.price);
        const isCostPriceValid = validateField("costPrice", formData.costPrice);
        const isStockValid = validateField("stock", formData.stock);

        if (isNameValid && isSkuValid && isPriceValid && isCostPriceValid && isStockValid && formData.category) {
            onSave(e);
        } else {
            console.log("Validation failed", errors);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-y-auto custom-scrollbar p-0 border-0 shadow-2xl bg-stone-50 rounded-xl overflow-hidden">
                <DialogHeader className="p-8 bg-stone-900 text-white relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                            <PlusCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {editingProduct ? "Refine Product" : "New Inventory Item"}
                            </DialogTitle>
                            <DialogDescription className="text-stone-400 mt-1">
                                Complete the form below to track your clothing stock.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleFormSubmit}>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Essential Details Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Identity</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={cn("bg-white border-stone-200 h-11 focus:ring-stone-900", errors.name && "border-red-500")}
                                    placeholder="Product Title"
                                />
                                {errors.name && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sku" className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">SKU Reference</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className={cn("bg-white border-stone-200 h-11 uppercase", errors.sku && "border-red-500")}
                                        placeholder="ST-001"
                                    />
                                    {errors.sku && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.sku}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barcode" className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Barcode ID</Label>
                                    <div className="relative group">
                                        <Input
                                            id="barcode"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                            className="bg-white border-stone-200 h-11 pl-4 pr-10"
                                            placeholder="Auto/Manual"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={generateRandomBarcode}
                                            className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-stone-100 rounded-md text-stone-500"
                                            title="Generate Random Barcode"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Primary Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val) => setFormData({ ...formData, category: val, subCategory: "" })}
                                    >
                                        <SelectTrigger className="bg-white border-stone-200 h-11">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parentCategories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 text-stone-400">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Sub-Category</Label>
                                    <Select
                                        value={formData.subCategory}
                                        onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                                        disabled={!formData.category}
                                    >
                                        <SelectTrigger className="bg-white border-stone-200 h-11 disabled:opacity-50">
                                            <SelectValue placeholder={formData.category ? "Select" : "Pick Parent First"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subCategories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Contextual Details</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-white border-stone-200 min-h-[90px] resize-none"
                                    placeholder="Fabrics, wash care, design notes..."
                                />
                            </div>
                        </div>

                        {/* Inventory & Pricing Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                                <h4 className="text-[10px] font-black text-stone-900 border-b border-stone-100 pb-3 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Financial Metrics
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-[10px] font-bold text-stone-500 uppercase">Sale Price (PKR)</Label>
                                        <div className="relative">
                                            <Input
                                                id="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className={cn("bg-stone-50/50 border-stone-200 h-10 font-bold", errors.price && "border-red-500")}
                                            />
                                        </div>
                                        {errors.price && <span className="text-[9px] text-red-500 font-bold uppercase">{errors.price}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice" className="text-[10px] font-bold text-stone-500 uppercase">Cost Value (PKR)</Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={handleInputChange}
                                            className={cn("bg-stone-50/50 border-stone-200 h-10 font-bold", errors.costPrice && "border-red-500")}
                                        />
                                        {errors.costPrice && <span className="text-[9px] text-red-500 font-bold uppercase">{errors.costPrice}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-900 p-5 rounded-2xl shadow-xl space-y-5">
                                <h4 className="text-[10px] font-black text-white/50 border-b border-white/5 pb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Boxes className="w-3 h-3" /> Stock Logistics
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock" className="text-[10px] font-bold text-white/30 uppercase">Initial Quant</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className={cn("bg-white/5 border-white/10 h-10 text-white font-bold", errors.stock && "border-red-500")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minStock" className="text-[10px] font-bold text-white/30 uppercase">Low Level</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                            className="bg-white/5 border-white/10 h-10 text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Media Assets</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl border border-stone-200 overflow-hidden bg-white group shadow-sm">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-red-500 hover:text-white text-stone-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="aspect-square border-2 border-dashed border-stone-200 hover:border-stone-900 hover:bg-white rounded-xl flex flex-col items-center justify-center gap-1 p-0 transition-all duration-300"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                                            <Camera className="w-4 h-4 text-stone-500" />
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-stone-400">Append</span>
                                    </Button>
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
                    </div>

                    <DialogFooter className="p-8 bg-white border-t border-stone-100 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-stone-400 hover:text-stone-900 font-black uppercase tracking-widest text-[10px]"
                        >
                            Dismiss
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || Object.values(errors).some(e => e)}
                            className="bg-stone-900 text-white hover:bg-stone-800 h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200 disabled:opacity-50 transition-all duration-300 transform active:scale-95"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Processing
                                </div>
                            ) : (
                                editingProduct ? "Synchronize Updates" : "Commit to Inventory"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
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
