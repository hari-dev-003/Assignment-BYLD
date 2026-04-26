import { Decimal } from 'decimal.js';

export function calcWeightedAvgCost(oldQty, oldAvg, newQty, newPrice) {
  const oq = new Decimal(oldQty.toString());
  const oa = new Decimal(oldAvg.toString());
  const nq = new Decimal(newQty.toString());
  const np = new Decimal(newPrice.toString());
  return oq.times(oa).plus(nq.times(np)).div(oq.plus(nq));
}

export function calcTotalCost(quantity, price) {
  return new Decimal(quantity.toString()).times(new Decimal(price.toString()));
}

export function calcProceeds(quantity, price) {
  return new Decimal(quantity.toString()).times(new Decimal(price.toString()));
}
