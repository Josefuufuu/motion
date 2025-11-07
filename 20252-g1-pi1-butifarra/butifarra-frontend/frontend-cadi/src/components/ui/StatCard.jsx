import PropTypes from "prop-types";
import Button from "./Button";
import AnimatedContainer from "./AnimatedContainer.jsx";

export default function StatCard({
  title,
  value,
  cta,
  onClick,
  tone = "indigo",
  className = "",
  animationDelay = 0,
}) {
  const rings = {
    indigo: "ring-indigo-100",
    orange: "ring-orange-100",
    green: "ring-green-100",
    purple: "ring-purple-100",
  };
  const ringClass = rings[tone] ?? rings.indigo;

  return (
    <AnimatedContainer
      as="article"
      variant="fade-up"
      delay={animationDelay}
      className={`interactive-card rounded-xl border p-4 ring-4 ${ringClass} bg-white ${className}`}
    >
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-3xl font-semibold my-1">{value}</div>
      {cta && (
        <Button variant="ghost" onClick={onClick} className="mt-2">
          {cta}
        </Button>
      )}
    </AnimatedContainer>
  );
}

StatCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  cta: PropTypes.string,
  onClick: PropTypes.func,
  tone: PropTypes.oneOf(["indigo", "orange", "green", "purple"]),
  className: PropTypes.string,
  animationDelay: PropTypes.number,
};
