import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, DollarSign, Barcode as BarcodeIcon, Package, Boxes } from "lucide-react";
import { useRef } from "react";

export function ProductModal({
    isOpen,
    onClose,
    editingProduct,
    formData,
    setFormData,
    categories,
    onSave,
    isSubmitting
}) {
    const fileInputRef = useRef(null);

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar p-0 border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-stone-900 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                            <DialogDescription className="text-stone-400">Enter product details to manage your inventory.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                    {/* Left Column - Details */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-stone-500">Product Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="border-stone-200 focus:ring-stone-900"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-widest text-stone-500">SKU / Code</Label>
                                <div className="relative">
                                    <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="pl-9 border-stone-200"
                                        placeholder="SKU-123"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="barcode" className="text-xs font-bold uppercase tracking-widest text-stone-500">Barcode</Label>
                                <Input
                                    id="barcode"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    className="border-stone-200"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-stone-500">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="border-stone-200">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-stone-500">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-stone-200 min-h-[100px] resize-none"
                                placeholder="Size, color, material etc."
                            />
                        </div>
                    </div>

                    {/* Right Column - Pricing & Stock */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-stone-500">Selling Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">Rs.</span>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="pl-10 border-stone-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costPrice" className="text-xs font-bold uppercase tracking-widest text-stone-500">Cost Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">Rs.</span>
                                    <Input
                                        id="costPrice"
                                        type="number"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                        className="pl-10 border-stone-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-widest text-stone-500">Current Stock</Label>
                                <div className="relative">
                                    <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="pl-9 border-stone-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStock" className="text-xs font-bold uppercase tracking-widest text-stone-500">Alert Level</Label>
                                <Input
                                    id="minStock"
                                    type="number"
                                    value={formData.minStockLevel}
                                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                    className="border-stone-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-stone-500">Product Images</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {formData.images?.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg border border-stone-200 overflow-hidden bg-stone-50 group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="aspect-square border-dashed border-stone-300 hover:border-stone-900 hover:bg-stone-50 flex flex-col items-center justify-center gap-1 p-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-5 h-5 text-stone-400" />
                                    <span className="text-[10px] font-bold uppercase text-stone-500">Add</span>
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

                <DialogFooter className="p-6 bg-stone-50 border-t border-stone-100">
                    <Button variant="ghost" onClick={onClose} className="text-stone-500 hover:text-stone-900 font-bold uppercase tracking-wider text-xs">
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="bg-stone-900 text-white hover:bg-stone-800 px-8 font-bold uppercase tracking-wider text-xs"
                    >
                        {isSubmitting ? "Saving..." : (editingProduct ? "Update Product" : "Create Product")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
