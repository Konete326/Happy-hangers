import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      setInterval(() => {
        reg.update().catch(() => {});
      }, 5 * 60 * 1000);

      const handleWaiting = (worker) => {
        window.dispatchEvent(new CustomEvent("swUpdateAvailable", { detail: worker }));
      };

      if (reg.waiting) {
        handleWaiting(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleWaiting(installingWorker);
            }
          });
        }
      });
    }).catch(() => {});

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}

window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  if (error && (
    error.message?.includes("Failed to fetch dynamically imported module") ||
    error.name === "ChunkLoadError" ||
    error.message?.includes("Failed to fetch")
  )) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("assetsLoadFailed"));
  }
});

window.addEventListener("error", (event) => {
  const target = event.target;
  if (target && (target.tagName === "SCRIPT" || target.tagName === "LINK")) {
    const url = target.src || target.href;
    if (url && (url.includes("/assets/") || url.includes("index-"))) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("assetsLoadFailed"));
    }
  }
}, true);
