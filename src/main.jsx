import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ApiTest from "./ApiTest.jsx";
import "./index.css";

const page = new URLSearchParams(window.location.search).get("page");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {page === "api-test" ? <ApiTest /> : <App />}
  </StrictMode>
);
