export interface TotalsCalculation {
  totalNet: number;
  vatAmount: number;
  totalGross: number;
}

export function calculateTotals(totalNet: number, vatRate: number): TotalsCalculation {
  const vatAmount = Math.round((totalNet * vatRate) / 100);
  const totalGross = totalNet + vatAmount;

  return {
    totalNet,
    vatAmount,
    totalGross,
  };
}
