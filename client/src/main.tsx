import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure React Refresh preamble is available
if (typeof window !== 'undefined' && import.meta.hot) {
  // Ensure the preamble is marked as installed
  (window as any).__vite_plugin_react_preamble_installed__ = true;
}

createRoot(document.getElementById("root")!).render(<App />);
