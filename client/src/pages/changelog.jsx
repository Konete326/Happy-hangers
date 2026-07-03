import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Printer, AppWindow, Cpu } from "lucide-react";

const changelogData = [
  {
    version: "v1.0.1",
    date: "June 10, 2026",
    title: "Security & Printing Update",
    description: "Important security improvements, auto-update engine integration, and thermal printing fixes.",
    isLatest: true,
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
        description: "Secured sales reports, return histories, orders, and dashboard APIs. Restricted queries based on role (Admin, Employee-Own, Employee-All) to prevent data isolation issues.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      {
        type: "Fix",
        category: "Hardware Integration",
        icon: Printer,
        title: "Thermal Printer Margins Adjustment",
        description: "Fixed horizontal receipt and barcode tag clipping issues on GP-U80300II direct thermal printers by aligning standard 72mm printable canvas offset to 0.",
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
        description: "A dual-mode checkout desk with lightning-fast local barcode query, custom pricing, discount triggers, and instant receipts generator.",
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
    <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-stone-50/30">
      <div className="max-w-3xl mx-auto space-y-12">
        {changelogData.map((release, index) => (
          <div key={release.version} className="relative">
            {index < changelogData.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-stone-200 -mb-12" />
            )}

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 font-semibold text-sm ${
                release.isLatest 
                  ? "bg-stone-900 text-white border-stone-900 shadow-sm" 
                  : "bg-white text-stone-500 border-stone-200"
              }`}>
                {release.version}
              </div>

              <div className="flex-1 space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-stone-900">{release.title}</h2>
                  <span className="text-xs text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded-full">
                    {release.date}
                  </span>
                  {release.isLatest && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Latest
                    </span>
                  )}
                </div>

                <p className="text-sm text-stone-500">{release.description}</p>

                <div className="grid gap-4 mt-2">
                  {release.changes.map((change, idx) => {
                    const Icon = change.icon;
                    return (
                      <Card key={idx} className="border-stone-200/80 shadow-none hover:shadow-sm hover:border-stone-300 transition-all duration-200">
                        <CardContent className="p-4 flex gap-4">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${change.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                {change.category}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 font-medium text-stone-600">
                                {change.type}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-stone-900">{change.title}</h3>
                            <p className="text-xs text-stone-500 leading-relaxed">{change.description}</p>
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
