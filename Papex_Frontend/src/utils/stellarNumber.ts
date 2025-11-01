const DEFAULT_DECIMALS = 7;
const TEN = 10n;

const pow10 = (decimals: number): bigint => {
  let result = 1n;
  for (let i = 0; i < decimals; i += 1) {
    result *= TEN;
  }
  return result;
};

const sanitizeInput = (value: string) => value.trim().replace(/,/g, '');

export const decimalToI128 = (value: string, decimals = DEFAULT_DECIMALS): bigint => {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return 0n;

  const negative = sanitized.startsWith('-');
  const unsigned = negative ? sanitized.slice(1) : sanitized;
  const [wholeRaw, fractionRaw = ''] = unsigned.split('.');
  const whole = wholeRaw ? BigInt(wholeRaw) : 0n;
  const scale = pow10(decimals);
  const fractionNormalized = (fractionRaw + '0'.repeat(decimals)).slice(0, decimals);
  const fraction = fractionNormalized ? BigInt(fractionNormalized) : 0n;

  const amount = whole * scale + fraction;
  return negative ? -amount : amount;
};

export const i128ToDecimal = (value: bigint, decimals = DEFAULT_DECIMALS): string => {
  const scale = pow10(decimals);
  const negative = value < 0;
  const absValue = negative ? -value : value;

  const whole = absValue / scale;
  const fraction = absValue % scale;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  const result = fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();
  return negative ? `-${result}` : result;
};

export const formatDecimal = (value: string | undefined | null, maximumFractionDigits = 3): string => {
  if (!value) return '0';
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};
