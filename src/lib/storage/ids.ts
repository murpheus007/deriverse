export function buildDerivedId(input: { openTs: string; closeTs: string; symbol: string; side: string }): string {
  return `${input.symbol}-${input.side}-${input.openTs}-${input.closeTs}`;
}
