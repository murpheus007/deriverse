const SCALE = 1_000_000;

export type Money = {
  raw: number;
};

export function toMoney(value: number): Money {
  return { raw: Math.round(value * SCALE) };
}

export function fromMoney(m: Money): number {
  return m.raw / SCALE;
}

export function addMoney(a: Money, b: Money): Money {
  return { raw: a.raw + b.raw };
}

export function subMoney(a: Money, b: Money): Money {
  return { raw: a.raw - b.raw };
}

export function mulMoney(a: Money, factor: number): Money {
  return { raw: Math.round(a.raw * factor) };
}

export function divMoney(a: Money, divisor: number): Money {
  return { raw: Math.round(a.raw / divisor) };
}

export function sumMoney(values: number[]): Money {
  return values.reduce((acc, val) => addMoney(acc, toMoney(val)), { raw: 0 });
}

export function toFixed(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}
