import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, Sparkles, X, ChevronRight, ChevronLeft, Package, CheckCircle2, Percent, ListTodo, Boxes } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import API from "@/api/api";

export function BulkSaleModal({ isOpen, onClose, products, fetchProducts, toast }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        saleLabel: "",
        discountPercentage: "",
        applyToAll: true,
        selectedIds: []
    });

    const resetWizard = () => {
        setStep(1);
        setFormData({
            saleLabel: "",
            discountPercentage: "",
            applyToAll: true,
            selectedIds: []
        });
    };

    useEffect(() => {
        if (isOpen) resetWizard();
    }, [isOpen]);

    const handleApply = async () => {
        if (!formData.saleLabel || !formData.discountPercentage) {
            toast({ title: "Incomplete", description: "Please fill in sale details.", variant: "destructive" });
            return;
        }

        if (!formData.applyToAll && formData.selectedIds.length === 0) {
            toast({ title: "No Selection", description: "Please select at least one product.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await API.patch("/products/bulk/sale", {
                productIds: formData.applyToAll ? [] : formData.selectedIds,
                saleLabel: formData.saleLabel,
                discountPercentage: formData.discountPercentage,
                onSale: true
            });
            toast({ title: "Success", description: "Bulk sale applied successfully!", className: "bg-emerald-600 text-white" });
            fetchProducts();
            onClose();
        } catch (error) {
            toast({ title: "Operation Failed", description: error.response?.data?.message || "Failed to apply bulk sale.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            selectedIds: prev.selectedIds.includes(id)
                ? prev.selectedIds.filter(i => i !== id)
                : [...prev.selectedIds, id]
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="sm:max-w-[600px] p-0 border-none shadow-2xl bg-[#fafafa] rounded-2xl overflow-hidden flex flex-col">
                <DialogHeader className="p-6 bg-stone-900 text-white shrink-0 relative">
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4 text-white/30 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Tag className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">Campaign Wizard</DialogTitle>
                            <DialogDescription className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">Bulk Discount Management</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-3 bg-stone-100/30 border-b border-stone-200/50 flex items-center justify-center gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                                step === s ? "bg-stone-900 text-white scale-110 shadow-md" :
                                    step > s ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"
                            )}>
                                {step > s ? <CheckCircle2 className="w-3 h-3" /> : s}
                            </div>
                            {s < 3 && <div className={cn("w-6 h-0.5 rounded-full", step > s ? "bg-emerald-500" : "bg-stone-200")} />}
                        </div>
                    ))}
                </div>

                <div className="flex-1 px-8 py-5 min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 py-2">
                            <div className="text-center space-y-1 mb-6">
                                <h2 className="text-lg font-black text-stone-900 tracking-tight">Campaign Details</h2>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Step 1: Set Labels & Rates</p>
                            </div>
                            <div className="space-y-4 max-w-sm mx-auto">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 ml-1">Sale Label (e.g. Flash Sale)</Label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
                                        <Input
                                            placeholder="Enter Tag Name"
                                            className="h-10 pl-9 border-stone-200 text-sm font-bold bg-white"
                                            value={formData.saleLabel}
                                            onChange={(e) => setFormData({ ...formData, saleLabel: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 ml-1">Discount Rate (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                        <Input
                                            type="number"
                                            placeholder="25"
                                            className="h-12 pl-10 border-stone-200 text-xl font-black bg-stone-50/50 focus:bg-white text-emerald-600"
                                            value={formData.discountPercentage}
                                            onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center space-y-1 mb-6">
                                <h2 className="text-lg font-black text-stone-900 tracking-tight">Select Audience</h2>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Step 2: Choose Scope</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setFormData({ ...formData, applyToAll: true })}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                                        formData.applyToAll ? "border-stone-900 bg-stone-50" : "border-stone-100 hover:border-stone-200"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-colors", formData.applyToAll ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400")}>
                                        <Boxes className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-stone-900">Entire Inventory</h3>
                                        <p className="text-[10px] text-stone-500 font-medium">Apply to all active products</p>
                                    </div>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.applyToAll ? "border-stone-900 bg-stone-900" : "border-stone-200")}>
                                        {formData.applyToAll && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setFormData({ ...formData, applyToAll: false })}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                                        !formData.applyToAll ? "border-stone-900 bg-stone-50" : "border-stone-100 hover:border-stone-200"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-colors", !formData.applyToAll ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400")}>
                                        <ListTodo className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-stone-900">Custom Selection</h3>
                                        <p className="text-[10px] text-stone-500 font-medium">Pick specific items manually</p>
                                    </div>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", !formData.applyToAll ? "border-stone-900 bg-stone-900" : "border-stone-200")}>
                                        {!formData.applyToAll && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {formData.applyToAll ? (
                                <div className="h-full flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100 animate-bounce">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-lg font-black text-stone-900">Final Confirmation</h2>
                                        <p className="text-[11px] text-stone-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                                            Apply <span className="text-emerald-600 font-black">{formData.discountPercentage}% OFF</span> across <span className="font-bold">ALL</span> items with label <span className="font-bold text-stone-900 italic">"{formData.saleLabel}"</span>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between sticky top-0 bg-[#fafafa] pb-2 z-10">
                                        <div>
                                            <h2 className="text-sm font-black text-stone-900 uppercase tracking-tight">Select Products</h2>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{formData.selectedIds.length} items marked</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="h-7 text-[9px] font-black uppercase text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-2"
                                            onClick={() => setFormData({ ...formData, selectedIds: products.map(p => p._id) })}
                                        >
                                            Select All
                                        </Button>
                                    </div>
                                    <div className="space-y-1 pr-1">
                                        {products.map((product) => (
                                            <div
                                                key={product._id}
                                                onClick={() => toggleSelection(product._id)}
                                                className={cn(
                                                    "group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border",
                                                    formData.selectedIds.includes(product._id)
                                                        ? "bg-stone-900 border-stone-900 text-white shadow-md ring-2 ring-stone-900/5 ring-offset-1"
                                                        : "hover:bg-white hover:border-stone-200 border-stone-100/50 bg-stone-50/30 text-stone-600"
                                                )}
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-white p-0.5 border border-stone-200 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} className="h-full w-full object-cover rounded-md" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-stone-50">
                                                            <Package className="w-4 h-4 text-stone-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">{product.name}</p>
                                                        {product.onSale && (
                                                            <span className="text-[7px] font-black bg-emerald-100 text-emerald-600 px-1 rounded-sm uppercase tracking-tighter shrink-0 animate-pulse">Active</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn("text-[8px] font-mono font-black", formData.selectedIds.includes(product._id) ? "text-stone-400" : "text-stone-300")}>{product.sku}</span>
                                                        <span className={cn("text-[9px] font-bold", formData.selectedIds.includes(product._id) ? "text-emerald-400" : "text-stone-900")}>Rs. {product.onSale ? product.discountPrice : product.price}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center",
                                                    formData.selectedIds.includes(product._id) ? "bg-emerald-500 border-emerald-500" : "border-stone-200"
                                                )}>
                                                    {formData.selectedIds.includes(product._id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-white border-t border-stone-100 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => step === 1 ? onClose() : setStep(step - 1)}
                        className="text-stone-400 hover:text-stone-900 font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        {step === 1 ? "Exit Wizard" : "Back Step"}
                    </Button>
                    <Button
                        disabled={isSubmitting || (step === 1 && (!formData.saleLabel || !formData.discountPercentage)) || (step === 3 && !formData.applyToAll && formData.selectedIds.length === 0)}
                        onClick={() => step < 3 ? setStep(step + 1) : handleApply()}
                        className={cn(
                            "min-w-[140px] h-12 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-lg",
                            step === 3 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-stone-900 hover:bg-stone-800 shadow-stone-200"
                        )}
                    >
                        {isSubmitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                {step < 3 ? "Next Step" : "Launch Sale"}
                                {step < 3 && <ChevronRight className="w-3 h-3" />}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RefreshCw({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
