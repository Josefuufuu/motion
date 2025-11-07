import PropTypes from "prop-types";
export default function Tag({ children, color="indigo" }) {
  const palette = {
    indigo: "text-indigo-700 bg-indigo-50",
    green:  "text-green-700 bg-green-50",
    purple: "text-purple-700 bg-purple-50",
    orange: "text-orange-700 bg-orange-50",
    gray:   "text-gray-700 bg-gray-100",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs ${palette[color]}`}>{children}</span>;
}
Tag.propTypes = { children: PropTypes.node, color: PropTypes.oneOf(["indigo","green","purple","orange","gray"]) };
