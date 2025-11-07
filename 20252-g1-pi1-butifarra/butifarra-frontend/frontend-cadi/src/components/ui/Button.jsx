// src/components/ui/Button.jsx
import PropTypes from "prop-types";

export default function Button({ variant="default", size="md", className="", ...props }) {
  const base = "inline-flex items-center justify-center rounded-lg border transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    default: "bg-white border-gray-300 hover:bg-gray-50",
    primary: "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
    ghost:   "bg-white border-gray-200 hover:border-gray-300",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-3 text-lg" };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
Button.propTypes = { variant: PropTypes.oneOf(["default","primary","ghost"]), size: PropTypes.oneOf(["sm","md","lg"]), className: PropTypes.string };
