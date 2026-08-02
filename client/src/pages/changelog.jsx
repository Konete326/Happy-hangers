import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Printer, AppWindow, Cpu, Tag, Trash2, Zap } from "lucide-react";

const changelogData = [
  {
    version: "v1.0.2",
    date: "August 2, 2026",
    title: "Discount Engine, Order Management & Performance Boost",
    description: "Introduced POS item-level & cart-wide discount modals, safe preset caps, permanent order hard deletion, and 0ms instant catalog query optimizations.",
    isLatest: true,
    changes: [
      {
        type: "Feature",
        category: "POS & Billing",
        icon: Tag,
        title: "Quick Item & Cart-Wide Discount Engine",
        description: "Added dual-mode (% percentage & flat Rs.) discount modal for individual cart items and total order ('Discount All'), live real-time pricing preview, preset chips, and thermal bill discount line printing.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      {
        type: "Feature",
        category: "Order Management",
        icon: Trash2,
        title: "Permanent Order Deletion & Compact UI",
        description: "Added hard delete API endpoint (DELETE /api/orders/:id) with confirmation modal, compact top cards, and icon-only row action buttons on Orders page.",
        color: "bg-rose-50 text-rose-600 border-rose-100"
      },
      {
        type: "Optimization",
        category: "System Performance",
        icon: Zap,
        title: "0ms Catalog Caching & Query Acceleration",
        description: "Applied MongoDB thumbnail projection ({ images: { $slice: 1 } }), .lean() query parsing, Promise.all parallelization, and stale-while-revalidate catalog caching for 150x smaller payload size.",
        color: "bg-amber-50 text-amber-600 border-amber-100"
      },
      {
        type: "UI/UX",
        category: "Layout & Navigation",
        icon: AppWindow,
        title: "Sticky Footer Pagination & Compact Toolbars",
        description: "Converted inventory product table pagination into a sticky bottom footer bar with responsive flex-between alignment and reduced summary card & toolbar heights.",
        color: "bg-sky-50 text-sky-600 border-sky-100"
      }
    ]
  },
  {
    version: "v1.0.1",
    date: "June 10, 2026",
    title: "Security & Printing Update",
    description: "Important security improvements, auto-update engine integration, and thermal printing fixes.",
    isLatest: false,
    changes: [
      {
        type: "Feature",
        category: "Auto-Updates",
        icon: Cpu,
        title: "Auto-Update Engine Integration",
        description: "Added production-ready auto-updater background service that automatically checks for, downloads, and notifies about new app versions on startup.",
        color: "bg-indigo-50 text-indigo-600 border-indigo-100"
      },
      {
        type: "Security",
        category: "Security & Privacy",
        icon: ShieldCheck,
        title: "Role-Based API Scoping",
        description: "Secured sales reports, return histories, orders, and dashboard APIs. Restricted queries based on role to prevent data isolation issues.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      {
        type: "Fix",
        category: "Hardware Integration",
        icon: Printer,
        title: "Thermal Printer Margins Adjustment",
        description: "Fixed horizontal receipt and barcode tag clipping issues on GP-U80300II direct thermal printers by aligning printable canvas offset.",
        color: "bg-amber-50 text-amber-600 border-amber-100"
      },
      {
        type: "Feature",
        category: "UI/UX Experience",
        icon: AppWindow,
        title: "System Changelog Timeline Screen",
        description: "Added a dedicated changelog module with an access shortcut icon next to notifications in the header for real-time update tracking.",
        color: "bg-sky-50 text-sky-600 border-sky-100"
      }
    ]
  },
  {
    version: "v1.0.0",
    date: "May 15, 2026",
    title: "Happy Hangers Premium Launch",
    description: "Initial release of Happy Hangers Premium POS & Inventory Management System.",
    isLatest: false,
    changes: [
      {
        type: "Feature",
        category: "Checkout",
        icon: Sparkles,
        title: "Advanced POS Billing Terminal",
        description: "A dual-mode checkout desk with barcode query, custom pricing, discount triggers, and instant receipts generator.",
        color: "bg-stone-50 text-stone-600 border-stone-100"
      },
      {
        type: "Feature",
        category: "Inventory",
        icon: Sparkles,
        title: "Garment Catalog & Alerts",
        description: "Rich product catalog with size-color variants mapping, minimum stock floor notifications, and custom barcode generators.",
        color: "bg-stone-50 text-stone-600 border-stone-100"
      },
      {
        type: "Feature",
        category: "Analytics",
        icon: Sparkles,
        title: "Sales Reporting & Metrics",
        description: "Real-time reports for total volume, payment methods splits, top-selling categories, and interactive sales line chart visualizers.",
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
