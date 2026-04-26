import { formatCurrency } from '../utils';

export const useCurrency = (currency = 'GBP') => {
  return {
    format: (cents: number) => formatCurrency(cents, currency),
    toCents: (value: number) => Math.round(value * 100),
    toDecimal: (cents: number) => cents / 100,
  };
};

