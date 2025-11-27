import { createRoot } from "react-dom/client";
import App from "./App";

const el = document.getElementById("root");
if (!el) throw new Error("root div missing in index.html");
createRoot(el).render(<App />);
