export const formatCurrency = (cents: number, currency = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency,
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
  }).format(cents / 100);
};

