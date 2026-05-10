import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 mt-8 border-t border-stone-200">
      <div className="px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex space-x-6">
            <div className="text-sm text-stone-600">
              © {currentYear}, made with{" "}
              <Heart className="w-3 h-3 inline-block text-red-500 fill-current" />{" "}
              by{" "}
              <span className="font-semibold text-stone-900">konete326</span>
            </div>
          </div>
          <div className="flex space-x-6">
            <a
              href="#!"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              About Us
            </a>
            <a
              href="#!"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
