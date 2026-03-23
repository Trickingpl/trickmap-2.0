import { STATUS_COLORS, DEFAULT_STATUS_COLOR } from '../constants/status';
import './HoverTooltip.css';

export default function HoverTooltip({ gathering, position }) {
  if (!gathering || !position) return null;

  const color = STATUS_COLORS[gathering.dateStatus] || DEFAULT_STATUS_COLOR;

  return (
    <div
      className="hover-tooltip"
      style={{
        left: position.x,
        top: position.y - 8,
      }}
    >
      <span className="hover-tooltip-dot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      <span className="hover-tooltip-name">{gathering.name}</span>
      <span className="hover-tooltip-city">{gathering.city}</span>
    </div>
  );
}
