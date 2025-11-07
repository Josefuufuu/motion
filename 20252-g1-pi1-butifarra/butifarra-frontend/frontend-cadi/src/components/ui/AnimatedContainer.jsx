import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";

const VARIANT_CLASSES = {
  fade: "motion-base motion-fade-in",
  "fade-up": "motion-base motion-fade-up",
  "fade-down": "motion-base motion-fade-down",
  "fade-left": "motion-base motion-fade-left",
  "fade-right": "motion-base motion-fade-right",
};

/**
 * Declarative wrapper that applies CSS-driven entrance animations while honoring
 * the user's reduced motion preferences. This component centralises our
 * animation tokens so views can opt into fade/slide behaviours consistently.
 */
export default function AnimatedContainer({
  as: Component = "div",
  variant = "fade-up",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return undefined;
    }

    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const variantClassName = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES["fade-up"];
  const combinedClassName = useMemo(() => {
    const motionClass = isVisible ? `${variantClassName} motion-visible` : variantClassName;
    return [motionClass, className].filter(Boolean).join(" ");
  }, [variantClassName, className, isVisible]);

  const mergedStyle = useMemo(() => {
    if (prefersReducedMotion || delay <= 0) {
      return style;
    }

    return { ...style, transitionDelay: `${delay}s` };
  }, [style, delay, prefersReducedMotion]);

  return (
    <Component className={combinedClassName} style={mergedStyle} {...rest}>
      {children}
    </Component>
  );
}

AnimatedContainer.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  variant: PropTypes.oneOf(Object.keys(VARIANT_CLASSES)),
  delay: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};
