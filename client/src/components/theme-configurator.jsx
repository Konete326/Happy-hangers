import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  RotateCcw,
  Download,
  Upload,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const defaultTheme = {
  primaryColor: "0 0% 0%",
  primaryColorForeground: "0 0% 100%",
  secondaryColor: "60 4.8% 95.9%",
  secondaryColorForeground: "24 9.8% 10%",
  borderRadius: 0.75,
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  darkMode: false,
};

const predefinedColors = [
  { name: "Black", value: "0 0% 0%", foreground: "0 0% 100%" },
  { name: "Blue", value: "207 90% 54%", foreground: "0 0% 100%" },
  { name: "Red", value: "0 72% 51%", foreground: "0 0% 100%" },
  { name: "Green", value: "142 71% 45%", foreground: "0 0% 100%" },
  { name: "Purple", value: "262 83% 58%", foreground: "0 0% 100%" },
  { name: "Orange", value: "25 95% 53%", foreground: "0 0% 100%" },
  { name: "Pink", value: "330 81% 60%", foreground: "0 0% 100%" },
  { name: "Cyan", value: "198 93% 60%", foreground: "0 0% 100%" },
];

const fontOptions = [
  { name: "Inter", value: "Inter" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lato", value: "Lato" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Poppins", value: "Poppins" },
];

export function ThemeConfigurator({ isOpen, onClose }) {
  const [theme, setTheme] = useState(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme-config");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme({ ...defaultTheme, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved theme:", e);
      }
    }
  }, []);

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;
    // Apply CSS variables
    root.style.setProperty("--primary", themeConfig.primaryColor);
    root.style.setProperty(
      "--primary-foreground",
      themeConfig.primaryColorForeground,
    );
    root.style.setProperty("--secondary", themeConfig.secondaryColor);
    root.style.setProperty(
      "--secondary-foreground",
      themeConfig.secondaryColorForeground,
    );
    root.style.setProperty("--sidebar-primary", themeConfig.primaryColor);
    root.style.setProperty(
      "--sidebar-primary-foreground",
      themeConfig.primaryColorForeground,
    );
    root.style.setProperty("--ring", themeConfig.primaryColor);
    root.style.setProperty("--sidebar-ring", themeConfig.primaryColor);
    root.style.setProperty("--radius", `${themeConfig.borderRadius}rem`);
    // Apply font settings
    root.style.setProperty(
      "--theme-font-family",
      `'${themeConfig.fontFamily}', system-ui, -apple-system, sans-serif`,
    );
    root.style.setProperty(
      "--theme-font-size-base",
      `${themeConfig.fontSize}px`,
    );
    root.style.setProperty(
      "--theme-font-weight-normal",
      themeConfig.fontWeight.normal.toString(),
    );
    root.style.setProperty(
      "--theme-font-weight-medium",
      themeConfig.fontWeight.medium.toString(),
    );
    root.style.setProperty(
      "--theme-font-weight-semibold",
      themeConfig.fontWeight.semibold.toString(),
    );
    root.style.setProperty(
      "--theme-font-weight-bold",
      themeConfig.fontWeight.bold.toString(),
    );
    // Apply dark mode
    if (themeConfig.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (updates) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    if (previewMode) {
      applyTheme(newTheme);
    }
  };

  const handlePreviewToggle = (enabled) => {
    setPreviewMode(enabled);
    if (enabled) {
      applyTheme(theme);
    } else {
      // Reset to default theme
      applyTheme(defaultTheme);
    }
  };

  const handleSave = () => {
    localStorage.setItem("theme-config", JSON.stringify(theme));
    applyTheme(theme);
    onClose();
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem("theme-config");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "theme-config.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result);
          const newTheme = { ...defaultTheme, ...imported };
          setTheme(newTheme);
          if (previewMode) {
            applyTheme(newTheme);
          }
        } catch (error) {
          console.error("Failed to import theme:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Theme Configurator
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />

                <Button variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </span>
                </Button>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Theme</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
