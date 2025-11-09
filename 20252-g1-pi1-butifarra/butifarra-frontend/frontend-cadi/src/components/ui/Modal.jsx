import { useEffect, useId, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiX } from "react-icons/fi";

import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";
import "./Modal.css";

const EXIT_DURATION_MS = 240;

export default function Modal({ isOpen, open, onClose, title, ariaLabel = "Ventana modal", children }) {
  const resolvedIsOpen = (isOpen ?? open) ?? false;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shouldRender, setShouldRender] = useState(resolvedIsOpen);
  const [isVisible, setIsVisible] = useState(resolvedIsOpen || prefersReducedMotion);
  const titleId = useId();

  useEffect(() => {
    if (resolvedIsOpen) {
      setShouldRender(true);
    }
  }, [resolvedIsOpen]);

  useEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    if (prefersReducedMotion) {
      setIsVisible(resolvedIsOpen);
      if (!resolvedIsOpen) {
        setShouldRender(false);
      }
      return undefined;
    }

    let timeoutId;
    let frameId;

    if (resolvedIsOpen) {
      frameId = requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeoutId = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [resolvedIsOpen, prefersReducedMotion, shouldRender]);

  const labelledProps = useMemo(() => {
    if (title) {
      return { "aria-labelledby": titleId };
    }
    return { "aria-label": ariaLabel };
  }, [title, ariaLabel, titleId]);

  if (!shouldRender) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const visibleClass = isVisible || prefersReducedMotion ? "motion-visible" : "";
  const showHeader = Boolean(title || onClose);

  return (
    <div className={`modal-overlay ${visibleClass}`} onClick={handleOverlayClick} role="presentation">
      <div className={`modal-content ${visibleClass}`} role="dialog" aria-modal="true" {...labelledProps}>
        {showHeader && (
          <header className="modal-header">
            {title && <h2 id={titleId}>{title}</h2>}
            {onClose && (
              <button
                type="button"
                className="modal-close-btn transition-base"
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <FiX />
              </button>
            )}
          </header>
        )}

        <main className="modal-body">{children}</main>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  children: PropTypes.node,
};