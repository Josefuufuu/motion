import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * React hook that tracks the user's reduced motion preference so that
 * animations can be disabled in an accessible way when necessary.
 */
export default function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(QUERY);
    const handleChange = (event) => setPrefersReducedMotion(event.matches);

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
    } else if (typeof mediaQueryList.addListener === "function") {
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQueryList.removeEventListener === "function") {
        mediaQueryList.removeEventListener("change", handleChange);
      } else if (typeof mediaQueryList.removeListener === "function") {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}
