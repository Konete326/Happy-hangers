import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Printer, AppWindow, Cpu, Tag, Trash2, Zap } from "lucide-react";

const changelogData = [
  {
    version: "v1.0.2",
    date: "August 2, 2026",
    title: "Smart Discounts, Order Deletion & Faster Loading",
    description: "Added easy item and full-cart discounts, permanent order removal, fixed table pagination, and made all store pages load instantly.",
    isLatest: true,
    changes: [
      {
        type: "Feature",
        category: "POS & Billing",
        icon: Tag,
        title: "Single Item & Full Cart Discounts",
        description: "Apply instant percentage or flat rupee discounts to single items or your entire cart with automatic savings calculations and printed bill receipts.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      {
        type: "Feature",
        category: "Order Management",
        icon: Trash2,
        title: "Permanent Order Removal",
        description: "Easily delete unwanted or test orders permanently with a quick confirmation popup, featuring cleaner compact order cards.",
        color: "bg-rose-50 text-rose-600 border-rose-100"
      },
      {
        type: "Improvement",
        category: "Speed & Performance",
        icon: Zap,
        title: "Instant Product & POS Page Loading",
        description: "Checkout and inventory pages now open instantly without delay, giving you a smooth, lag-free billing experience.",
        color: "bg-amber-50 text-amber-600 border-amber-100"
      },
      {
        type: "Design",
        category: "Interface & Layout",
        icon: AppWindow,
        title: "Sticky Table Controls & Sleeker Design",
        description: "Page navigation buttons now stay fixed at the bottom while scrolling through products, and top stats cards are now smaller and cleaner.",
        color: "bg-sky-50 text-sky-600 border-sky-100"
      }
    ]
  },
  {
    version: "v1.0.1",
    date: "June 10, 2026",
    title: "Security & Printing Updates",
    description: "Enhanced data safety, automatic app updates, and improved receipt printing.",
    isLatest: false,
    changes: [
      {
        type: "Feature",
        category: "Auto Updates",
        icon: Cpu,
        title: "Automatic App Updates",
        description: "The app now automatically checks for new improvements when launched and updates seamlessly in the background.",
        color: "bg-indigo-50 text-indigo-600 border-indigo-100"
      },
      {
        type: "Security",
        category: "Data Protection",
        icon: ShieldCheck,
        title: "User Role Security",
        description: "Secured sales reports and store records so cashiers and managers only access their allowed information.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      {
        type: "Fix",
        category: "Receipt Printing",
        icon: Printer,
        title: "Thermal Printer Alignment Fix",
        description: "Adjusted bill alignment so store logos, customer totals, and barcode tags print perfectly without cutoffs on thermal receipt printers.",
        color: "bg-amber-50 text-amber-600 border-amber-100"
      },
      {
        type: "Feature",
        category: "Updates Tracker",
        icon: AppWindow,
        title: "App Updates & Changelog Screen",
        description: "Added a dedicated updates screen accessible right from the header to keep you informed about new app features.",
        color: "bg-sky-50 text-sky-600 border-sky-100"
      }
    ]
  },
  {
    version: "v1.0.0",
    date: "May 15, 2026",
    title: "Happy Hangers Official Launch",
    description: "Initial release of Happy Hangers POS & Inventory Management system.",
    isLatest: false,
    changes: [
      {
        type: "Feature",
        category: "Checkout",
        icon: Sparkles,
        title: "Point of Sale (POS) Billing Counter",
        description: "Fast checkout counter with barcode scanning, quick customer billing, and instant receipt generation.",
        color: "bg-stone-50 text-stone-600 border-stone-100"
      },
      {
        type: "Feature",
        category: "Inventory",
        icon: Sparkles,
        title: "Garment Catalog & Stock Alerts",
        description: "Complete clothing catalog management with low stock warnings and custom barcode printing.",
        color: "bg-stone-50 text-stone-600 border-stone-100"
      },
      {
        type: "Feature",
        category: "Analytics",
        icon: Sparkles,
        title: "Sales Reports & Daily Summary",
        description: "Track daily store revenue, top-selling items, cash/card payment splits, and visual sales performance charts.",
        color: "bg-stone-50 text-stone-600 border-stone-100"
      }
    ]
  }
];

export default function Changelog() {
  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-stone-50/30">
      <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
        {changelogData.map((release) => (
          <div key={release.version} className="relative bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 font-black text-xs ${
                release.isLatest 
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs" 
                  : "bg-stone-100 text-stone-600 border-stone-200"
              }`}>
                {release.version}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-900">{release.title}</h2>
                  <span className="text-[11px] text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded-full">
                    {release.date}
                  </span>
                  {release.isLatest && (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Latest Release
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500 font-medium">{release.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {release.changes.map((change, idx) => {
                    const Icon = change.icon;
                    return (
                      <Card key={idx} className="border-stone-200/80 shadow-none hover:shadow-xs hover:border-stone-300 transition-all duration-200 bg-stone-50/40">
                        <CardContent className="p-3 flex gap-3 items-start">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${change.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                {change.category}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200/60 font-bold text-stone-700">
                                {change.type}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-stone-900 leading-snug">{change.title}</h3>
                            <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{change.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
