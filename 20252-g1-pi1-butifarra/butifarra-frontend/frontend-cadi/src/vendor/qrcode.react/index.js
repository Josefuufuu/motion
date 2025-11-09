import { useMemo } from 'react';
import PropTypes from 'prop-types';

const buildUrl = (value, size, fgColor, bgColor) => {
  const params = new URLSearchParams({
    text: value ?? '',
    size: String(size ?? 256),
    dark: (fgColor ?? '#000000').replace('#', ''),
    light: (bgColor ?? '#ffffff').replace('#', ''),
  });
  return `https://quickchart.io/qr?${params.toString()}`;
};

export const QRCodeSVG = ({ value, size = 256, fgColor = '#000000', bgColor = '#ffffff', ...props }) => {
  const href = useMemo(() => buildUrl(value, size, fgColor, bgColor), [value, size, fgColor, bgColor]);
  const numericSize = Number.isFinite(size) ? size : 256;
  return (
    <svg
      role="img"
      aria-label="Código QR"
      width={numericSize}
      height={numericSize}
      viewBox={`0 0 ${numericSize} ${numericSize}`}
      {...props}
    >
      <title>Código QR</title>
      <image href={href} width={numericSize} height={numericSize} preserveAspectRatio="xMidYMid slice" />
    </svg>
  );
};

QRCodeSVG.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fgColor: PropTypes.string,
  bgColor: PropTypes.string,
};

export default QRCodeSVG;
