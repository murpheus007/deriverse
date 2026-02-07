export function buildEventId(input: { txSig: string; ts: string; symbol: string; qty: number; price: number }) {
  const raw = `${input.txSig}-${input.ts}-${input.symbol}-${input.qty}-${input.price}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return `e${Math.abs(hash).toString(16)}`;
}
