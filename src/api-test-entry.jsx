import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ApiTest from "./ApiTest";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ApiTest />
  </StrictMode>
);
