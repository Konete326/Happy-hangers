import { useState, useEffect, useRef } from "react";
import { RefreshCw, Sparkles, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [assetsFailed, setAssetsFailed] = useState(false);
  const waitingWorkerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (event) => {
      waitingWorkerRef.current = event.detail;
      setUpdateAvailable(true);
    };

    const handleAssetsFailed = () => {
      setAssetsFailed(true);
    };

    window.addEventListener("swUpdateAvailable", handleUpdate);
    window.addEventListener("assetsLoadFailed", handleAssetsFailed);

    return () => {
      window.removeEventListener("swUpdateAvailable", handleUpdate);
      window.removeEventListener("assetsLoadFailed", handleAssetsFailed);
    };
  }, []);

  const handleUpdateApp = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  const handleReloadApp = () => {
    window.location.reload();
  };

  const handleCloseBanner = () => {
    setUpdateAvailable(false);
  };

  return (
    <>
      {updateAvailable && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="relative overflow-hidden rounded-xl border border-border bg-background/80 p-5 shadow-2xl backdrop-blur-md">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-stone-500 via-primary to-stone-500" />
            <button
              onClick={handleCloseBanner}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Update Available</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    A new version of Happy Hangers is ready. Reload now to get the latest features and fixes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleUpdateApp}
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <RefreshCw className="size-3.5" />
                    Update Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {assetsFailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-md animate-in fade-in duration-250">
          <div className="max-w-md w-full rounded-xl border border-border bg-background/90 p-6 shadow-2xl animate-in zoom-in-95 duration-250">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-foreground">Application Updated</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Some application assets could not be loaded because a new version was deployed. Reload to continue smoothly.
                </p>
              </div>
              <Button
                onClick={handleReloadApp}
                className="w-full mt-2 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="size-4" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
