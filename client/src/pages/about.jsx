import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, ShieldCheck } from "lucide-react";

export default function About() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-stone-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-4">Empowering Clothing Retail</h1>
                    <p className="text-stone-400 max-w-2xl mx-auto text-lg">
                        Happy Hanger is a premium Inventory & POS solution designed specifically for modern garment businesses.
                        We bridge the gap between physical stock and digital management.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-800 rounded-full -mr-32 -mt-32 opacity-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-stone-200">
                    <CardHeader>
                        <Users className="w-8 h-8 text-stone-800 mb-2" />
                        <CardTitle className="text-xl">Our Team</CardTitle>
                    </CardHeader>
                    <CardContent className="text-stone-600 text-sm leading-relaxed">
                        Founded by industry experts, our team combines tech-prowess with deep retail experience to build tools that actually work on the shop floor.
                    </CardContent>
                </Card>

                <Card className="border-stone-200">
                    <CardHeader>
                        <Target className="w-8 h-8 text-stone-800 mb-2" />
                        <CardTitle className="text-xl">Our Mission</CardTitle>
                    </CardHeader>
                    <CardContent className="text-stone-600 text-sm leading-relaxed">
                        To eliminate manual errors in billing and stock tracking through automated barcode systems, making checkouts faster and more reliable.
                    </CardContent>
                </Card>

                <Card className="border-stone-200">
                    <CardHeader>
                        <ShieldCheck className="w-8 h-8 text-stone-800 mb-2" />
                        <CardTitle className="text-xl">Our Values</CardTitle>
                    </CardHeader>
                    <CardContent className="text-stone-600 text-sm leading-relaxed">
                        Reliability, scalability, and premium design. We believe that professional tools should be as beautiful as they are functional.
                    </CardContent>
                </Card>
            </div>

            <Card className="border-stone-200 overflow-hidden">
                <div className="bg-stone-50 p-8 border-b border-stone-200">
                    <h2 className="text-2xl font-bold text-stone-800">The Happy Hanger Story</h2>
                </div>
                <CardContent className="p-8 space-y-4 text-stone-700">
                    <p>
                        What started as a small project to help a local clothing boutique has evolved into a comprehensive management suite.
                        We noticed that generic POS systems lacked the specific nuances of garment retail—like size-color variances and the
                        need for rugged, fast barcode integration.
                    </p>
                    <p>
                        Today, Happy Hanger serves as the digital backbone for shops that value accuracy, speed, and a premium aesthetic experience for both owners and customers.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
