import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { calcWeightedAvgCost, calcTotalCost, calcProceeds } from '../../src/utils/finance.js';

describe('calcWeightedAvgCost — weighted average cost basis', () => {
  it('first buy: oldQty=0 collapses to the new price', () => {
    // (0×0 + 10×2950) / (0+10) = 2950
    const result = calcWeightedAvgCost(0, 0, 10, 2950);
    expect(result.toFixed(4)).toBe('2950.0000');
  });

  it('second buy at a higher price raises the average', () => {
    // (10×2950 + 5×3100) / 15 = (29500+15500)/15 = 45000/15 = 3000
    const result = calcWeightedAvgCost(10, 2950, 5, 3100);
    expect(result.toFixed(4)).toBe('3000.0000');
  });

  it('second buy at a lower price lowers the average', () => {
    // (10×2950 + 10×2800) / 20 = (29500+28000)/20 = 57500/20 = 2875
    const result = calcWeightedAvgCost(10, 2950, 10, 2800);
    expect(result.toFixed(4)).toBe('2875.0000');
  });

  it('large quantity imbalance: small buy barely moves the average', () => {
    // (100×500 + 1×1000) / 101 = 51000/101 = 504.9504...
    const result = calcWeightedAvgCost(100, 500, 1, 1000);
    expect(result.toFixed(4)).toBe('504.9505');
  });
});

describe('calcTotalCost — buy cost precision', () => {
  it('computes total cost with decimal precision', () => {
    // 6 × 2956.45 = 17738.70
    const result = calcTotalCost(6, 2956.45);
    expect(result.toFixed(4)).toBe('17738.7000');
  });

  it('returns a Decimal instance', () => {
    const result = calcTotalCost(10, 100);
    expect(result).toBeInstanceOf(Decimal);
  });
});

describe('calcProceeds — sell proceeds precision', () => {
  it('computes proceeds with decimal precision', () => {
    // 11 × 2948 = 32428
    const result = calcProceeds(11, 2948);
    expect(result.toFixed(4)).toBe('32428.0000');
  });

  it('returns a Decimal instance', () => {
    const result = calcProceeds(5, 150.75);
    expect(result).toBeInstanceOf(Decimal);
  });
});
