import { Package, AlertCircle, Boxes, Tag, TrendingDown, TrendingUp } from "lucide-react";

export function ProductStats({ products, onFilterSelect }) {
    const outOfStock = products.filter(p => (p.stock || 0) <= 0).length;
    const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStockLevel || 5)).length;
    const onSale = products.filter(p => p.onSale).length;
    const totalItems = products.length;
    const healthyStock = totalItems - outOfStock - lowStock;

    const stats = [
        {
            label: "Total Products",
            value: totalItems,
            sub: `${healthyStock} healthy · ${lowStock} low · ${outOfStock} out`,
            icon: Boxes,
            color: "stone",
            bar: totalItems > 0 ? (healthyStock / totalItems) * 100 : 0,
            barColor: "bg-stone-700",
            accent: "border-stone-900",
            bg: "bg-stone-900",
            text: "text-white",
            subText: "text-stone-400",
            iconBg: "bg-white/10 text-white",
            filterId: "all"
        },
        {
            label: "Out of Stock",
            value: outOfStock,
            sub: outOfStock > 0 ? "Requires immediate restock" : "All items available",
            icon: AlertCircle,
            bar: totalItems > 0 ? (outOfStock / totalItems) * 100 : 0,
            barColor: "bg-red-500",
            accent: "border-red-500",
            bg: "bg-white",
            text: "text-red-600",
            subText: outOfStock > 0 ? "text-red-500" : "text-emerald-600",
            iconBg: "bg-red-50 text-red-500",
            badge: outOfStock > 0 ? { label: "Critical", cls: "bg-red-100 text-red-600" } : { label: "Clear", cls: "bg-emerald-100 text-emerald-600" },
            filterId: "out-of-stock"
        },
        {
            label: "Low Stock",
            value: lowStock,
            sub: lowStock > 0 ? "Below minimum threshold" : "Stock levels healthy",
            icon: TrendingDown,
            bar: totalItems > 0 ? (lowStock / totalItems) * 100 : 0,
            barColor: "bg-amber-400",
            accent: "border-amber-400",
            bg: "bg-white",
            text: "text-amber-600",
            subText: lowStock > 0 ? "text-amber-500" : "text-emerald-600",
            iconBg: "bg-amber-50 text-amber-500",
            badge: lowStock > 0 ? { label: "Warning", cls: "bg-amber-100 text-amber-600" } : { label: "OK", cls: "bg-emerald-100 text-emerald-600" },
            filterId: "low-stock"
        },
        {
            label: "On Sale",
            value: onSale,
            sub: onSale > 0 ? `${Math.round((onSale / totalItems) * 100)}% of inventory discounted` : "No active promotions",
            icon: Tag,
            bar: totalItems > 0 ? (onSale / totalItems) * 100 : 0,
            barColor: "bg-emerald-500",
            accent: "border-emerald-500",
            bg: "bg-white",
            text: "text-emerald-600",
            subText: "text-stone-500",
            iconBg: "bg-emerald-50 text-emerald-500",
            badge: onSale > 0 ? { label: "Active", cls: "bg-emerald-100 text-emerald-600" } : null,
            filterId: "on-sale"
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    onClick={() => onFilterSelect && onFilterSelect(stat.filterId)}
                    className={`relative rounded-2xl border-l-4 ${stat.accent} ${stat.bg} shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border border-stone-100 cursor-pointer`}
                >
                    {/* Top Row */}
                    <div className="flex items-start justify-between px-5 pt-5 pb-3">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${stat.text === "text-white" ? "text-stone-400" : "text-stone-400"}`}>
                                {stat.label}
                            </p>
                            <div className={`text-4xl font-black leading-none mt-1 ${stat.text}`}>
                                {stat.value}
                            </div>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} shrink-0`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-5 mb-3">
                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${stat.barColor}`}
                                style={{ width: `${Math.max(stat.bar, stat.value > 0 ? 8 : 0)}%` }}
                            />
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between px-5 pb-4">
                        <p className={`text-[10px] font-medium ${stat.subText} truncate max-w-[120px]`}>{stat.sub}</p>
                        {stat.badge && (
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${stat.badge.cls} shrink-0`}>
                                {stat.badge.label}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
