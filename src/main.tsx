import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyHash } from "#hooks/useDeepLink";
import { isMobileViewport } from "#mobile/useIsMobile";

/*
 * The desktop is pointed at the URL before anything renders. From an effect
 * instead, the first render describes a desktop that predates the link, and
 * that description gets written straight back over the address.
 *
 * The phone shell reads the same URLs from inside itself, because opening an
 * app there also pushes the history entry its Back gesture depends on.
 */
if (!isMobileViewport()) applyHash();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
