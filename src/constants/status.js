export const STATUS_CONFIG = {
  confirmed: { color: '#00e676', label: 'Confirmed', bg: 'rgba(0, 230, 118, 0.1)' },
  tbd: { color: '#ffab00', label: 'TBD', bg: 'rgba(255, 171, 0, 0.1)' },
  past: { color: '#666680', label: 'Past', bg: 'rgba(102, 102, 128, 0.1)' },
};

export const STATUS_COLORS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.color])
);

export const STATUS_LEGEND = Object.entries(STATUS_CONFIG).map(([key, v]) => ({
  key,
  color: v.color,
}));

export const DEFAULT_STATUS_COLOR = STATUS_COLORS.tbd;

export const SPOT_COLOR = '#b388ff';

export const SPOT_TYPES = ['gym', 'park', 'beach', 'other'];
