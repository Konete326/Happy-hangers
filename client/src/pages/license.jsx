import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function License() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-stone-200">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <CardTitle className="text-2xl font-bold text-stone-900">Standard License Agreement</CardTitle>
                    <p className="text-sm text-stone-500">Last Updated: May 2026</p>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[60vh] p-8">
                        <div className="space-y-6 text-stone-700 leading-relaxed">
                            <section>
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">1. Preamble</h3>
                                <p>
                                    This License Agreement defines the terms under which the Happy Hangers software and its associated
                                    services are provided to you. By using this software, you agree to be bound by these terms.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">2. Ownership</h3>
                                <p>
                                    The software, including all its source code, design systems, and digital assets, remain the
                                    exclusive property of elitedevagency. This is a license to use the software, not a sale of the underlying code.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">3. Permitted Use</h3>
                                <p>
                                    This license permits the use of Happy Hangers for commercial garment retail operations.
                                    You may:
                                </p>
                                <ul className="list-disc pl-6 space-y-1 mt-2">
                                    <li>Manage product inventory and stock levels.</li>
                                    <li>Generate and print barcodes for physical retail items.</li>
                                    <li>Perform sales transactions and generate reports.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">4. Restrictions</h3>
                                <p>
                                    User may not:
                                </p>
                                <ul className="list-disc pl-6 space-y-1 mt-2">
                                    <li>Redistribute or resell the source code of this software.</li>
                                    <li>Reverse engineer or decompile the application components.</li>
                                    <li>Use the software for any illegal POS or billing activities.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-stone-900 mb-2">5. Disclaimer</h3>
                                <p>
                                    The software is provided "as is", without warranty of any kind. elitedevagency shall not
                                    be held liable for any data loss, hardware compatibility issues with printers, or
                                    indirect damages resulting from the use of this software.
                                </p>
                            </section>

                            <div className="pt-8 border-t border-stone-100 text-stone-400 text-sm">
                                Copyright © {currentYear} elitedevagency. All rights reserved.
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="bg-stone-100 p-6 rounded-xl border border-stone-200">
                <p className="text-sm text-stone-600 text-center">
                    For enterprise licensing or redistribution rights, please contact our support team.
                </p>
            </div>
        </div>
    );
}
