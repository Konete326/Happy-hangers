import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { ThemeConfigurator } from "../theme-configurator";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";

export function Layout({ children, title, description }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [themeConfigOpen, setThemeConfigOpen] = useState(false);

    return (
        <div className="flex h-screen bg-stone-50 grain-texture">

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}


            <div
                className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-10
        transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            <main className="flex-1 relative z-10 flex flex-col min-h-0">
                <div className="lg:hidden mb-4 flex items-center justify-between p-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setThemeConfigOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-3 lg:p-6 flex flex-col min-h-0">
                    <Card className="flex-1 border border-stone-200 bg-white relative z-20 overflow-hidden flex flex-col shadow-sm">
                        {title && (
                            <div className="pt-6 px-3 lg:px-6 pb-4 bg-white z-20 sticky top-0 border-b border-stone-100">
                                <h1 className="text-xl font-semibold text-stone-900 mb-1">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm text-stone-600">{description}</p>
                                )}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col p-0">
                            {children}
                        </div>
                    </Card>
                </div>
                <div className="shrink-0">
                    <Footer />
                </div>
            </main>


            <ThemeConfigurator
                isOpen={themeConfigOpen}
                onClose={() => setThemeConfigOpen(false)}
            />
        </div>
    );
}
