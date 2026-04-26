import { formatCurrency } from '../utils';

interface CurrencyDisplayProps {
  cents: number;
  currency?: string;
  className?: string;
}

export const CurrencyDisplay = ({ cents, currency = 'GBP', className }: CurrencyDisplayProps) => {
  return <span className={className}>{formatCurrency(cents, currency)}</span>;
};

