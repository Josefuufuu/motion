import PropTypes from "prop-types";
import Button from "./Button";
import AnimatedContainer from "./AnimatedContainer.jsx";

export default function SectionHeader({ title, onViewAll, className = "" }) {
  return (
    <AnimatedContainer as="div" variant="fade" className={`flex items-center justify-between my-4 ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {onViewAll && (
        <Button size="sm" onClick={onViewAll}>
          Ver todas
        </Button>
      )}
    </AnimatedContainer>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onViewAll: PropTypes.func,
  className: PropTypes.string,
};
