import { Button } from "@/components/ui/button";
import { Printer, Trash2, X } from "lucide-react";

export function BatchActionBar({ selectedCount, onClear, onPrint, onDelete }) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-stone-900 text-white rounded-2xl shadow-2xl border border-stone-800 px-6 py-4 flex items-center gap-8 backdrop-blur-xl bg-opacity-95">
                <div className="flex items-center gap-3 pr-8 border-r border-stone-700">
                    <div className="bg-white text-stone-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Units Selected</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-300 hover:text-white hover:bg-stone-800 transition-all font-medium"
                        onClick={onPrint}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Batch Print Tags
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-all font-medium"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Batch
                    </Button>
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 ml-4 group"
                    onClick={onClear}
                >
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                </Button>
            </div>
        </div>
    );
}
