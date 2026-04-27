export const formatPercent = (value: number | undefined | null): string => {
  if (value == null || !Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
};

