import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on load
const savedTheme = localStorage.getItem('opspilot-theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
}

createRoot(document.getElementById("root")!).render(<App />);
