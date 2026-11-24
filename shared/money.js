
const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

export function toCents(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new TypeError("Money must be a number or numeric string.");
  }

  const input = String(value).trim();

  if (!input || !/^-?\d+(?:\.\d{1,2})?$/.test(input)) {
    throw new Error("Amount must be a valid number with no more than two decimal places.");
  }

  const negative = input.startsWith("-");
  const unsigned = negative ? input.slice(1) : input;
  const [whole, fraction = ""] = unsigned.split(".");

  const cents =
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, "0") || "0");

  const signedCents = negative ? -cents : cents;

  if (
    signedCents > BigInt(MAX_SAFE_CENTS) ||
    signedCents < BigInt(-MAX_SAFE_CENTS)
  ) {
    throw new RangeError("Amount exceeds the supported monetary range.");
  }

  return Number(signedCents);
}

export function fromCents(cents) {
  if (!Number.isSafeInteger(cents)) {
    throw new TypeError("Cents must be a safe integer.");
  }

  return cents / 100;
}

function assertSafeCents(cents) {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Calculated amount exceeds the supported range.");
  }

  return cents;
}

export function addMoney(...amounts) {
  const total = amounts.reduce(
    (sum, amount) =>
      assertSafeCents(sum + toCents(amount)),
    0
  );

  return fromCents(total);
}

export function subtractMoney(first, second) {
  const difference = toCents(first) - toCents(second);
  return fromCents(assertSafeCents(difference));
}

export function compareMoney(first, second) {
  const a = toCents(first);
  const b = toCents(second);

  return a === b ? 0 : a > b ? 1 : -1;
}

export function validateMoney(
  value,
  { min = 0, max = 100000000 } = {}
) {
  const cents = toCents(value);
  const minimum = toCents(min);
  const maximum = toCents(max);

  if (cents < minimum) {
    throw new Error("Amount is below the permitted minimum.");
  }

  if (cents > maximum) {
    throw new Error("Amount exceeds the permitted maximum.");
  }

  return fromCents(cents);
}

export function formatAUD(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(toCents(value)));
}
