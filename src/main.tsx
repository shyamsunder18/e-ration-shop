import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { LanguageProvider } from "./hooks/useLanguage";

const STORAGE_RESET_VERSION = "2026-03-27-session-reset";

if (window.location.hostname === "localhost") {
  const normalizedUrl = new URL(window.location.href);
  normalizedUrl.hostname = "127.0.0.1";
  window.location.replace(normalizedUrl.toString());
}

if (localStorage.getItem("app_storage_reset_version") !== STORAGE_RESET_VERSION) {
  localStorage.removeItem("user");
  localStorage.removeItem("lastRegistration");
  localStorage.setItem("app_storage_reset_version", STORAGE_RESET_VERSION);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>
);
