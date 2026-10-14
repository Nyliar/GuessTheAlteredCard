import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { publicUrl } from "./publicUrl";
import "./styles.css";

document.documentElement.style.setProperty("--page-bg", `url("${publicUrl("bg.png")}")`);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
