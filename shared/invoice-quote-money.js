import { fromCents, toCents } from "./money.js";

function assertSafeCents(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} exceeds the supported monetary range.`);
  }
  return value;
}

function quantityNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new TypeError("Line-item quantity must be numeric.");
  }

  const text = String(value).trim();

  if (!text || !/^\d+(?:\.\d+)?$/.test(text)) {
    throw new Error("Line-item quantity must be a valid non-negative number.");
  }

  const quantity = Number(text);

  if (!Number.isFinite(quantity)) {
    throw new Error("Line-item quantity must be finite.");
  }

  return quantity;
}

export function calculateLineItemsCents(lineItems = []) {
  if (!Array.isArray(lineItems)) {
    throw new TypeError("Line items must be an array.");
  }

  return lineItems.reduce((sum, item) => {
    const quantity = quantityNumber(item?.quantity ?? 0);
    const rateCents = toCents(item?.rate ?? 0);
    const lineCents = quantity * rateCents;

    if (!Number.isSafeInteger(lineCents)) {
      throw new Error("Each line-item total must resolve to an exact amount of cents.");
    }

    return assertSafeCents(sum + lineCents, "Line-item subtotal");
  }, 0);
}

export function calculateInvoiceAmountCents(invoice = {}) {
  const hasAmount = invoice.amount !== undefined &&
    invoice.amount !== null && invoice.amount !== "";

  const hasTotal = invoice.total !== undefined &&
    invoice.total !== null && invoice.total !== "";

  const lineItems = Array.isArray(invoice.lineItems)
    ? invoice.lineItems
    : [];

  const calculated = calculateLineItemsCents(lineItems);

  if (hasAmount && hasTotal) {
    const amountCents = toCents(invoice.amount);
    const totalCents = toCents(invoice.total);

    if (amountCents !== totalCents) {
      throw new Error("Invoice amount and total must match.");
    }
  }

  if (lineItems.length > 0) {
    if (hasAmount && toCents(invoice.amount) !== calculated) {
      throw new Error("Invoice amount does not match the line-item calculations.");
    }

    if (hasTotal && toCents(invoice.total) !== calculated) {
      throw new Error("Invoice total does not match the line-item calculations.");
    }
  }

  if (hasAmount) return toCents(invoice.amount);
  if (hasTotal) return toCents(invoice.total);

  return calculated;
}

export function reconcileInvoiceCents(totalCents, payments = []) {
  assertSafeCents(totalCents, "Invoice total");

  const netPaidCents = payments.reduce((sum, payment) => {
    const amountCents = toCents(payment.amount);

    if (amountCents < 0) {
      throw new Error("Payment amounts must be non-negative; use a refund transaction for adjustments.");
    }

    const signed = payment.isRefund ? -amountCents : amountCents;

    return assertSafeCents(sum + signed, "Invoice payment total");
  }, 0);

  const paidCents = Math.max(netPaidCents, 0);

  return {
    amountPaid: fromCents(paidCents),
    balance: fromCents(Math.max(totalCents - paidCents, 0)),
    netPaidCents,
  };
}

export function calculateQuoteAmounts(quote = {}) {
  const lineItems = Array.isArray(quote.lineItems) ? quote.lineItems : [];
  const calculatedSubtotalCents = calculateLineItemsCents(lineItems);

  const hasSubtotal = quote.subtotal !== undefined &&
    quote.subtotal !== null && quote.subtotal !== "";

  const subtotalCents = hasSubtotal
    ? toCents(quote.subtotal)
    : calculatedSubtotalCents;

  if (
    lineItems.length > 0 &&
    hasSubtotal &&
    subtotalCents !== calculatedSubtotalCents
  ) {
    throw new Error("Quote subtotal does not match the line-item calculations.");
  }

  const gstCents = toCents(quote.gst ?? 0);

  if (gstCents < 0) {
    throw new Error("GST cannot be negative.");
  }

  const totalCents = assertSafeCents(
    subtotalCents + gstCents,
    "Quote total"
  );

  const hasTotal = quote.total !== undefined &&
    quote.total !== null && quote.total !== "";

  if (hasTotal && toCents(quote.total) !== totalCents) {
    throw new Error("Quote total must equal subtotal plus GST.");
  }

  const depositValue = quote.depositRequired ?? quote.deposit ?? 0;
  const depositCents = toCents(depositValue);

  if (depositCents < 0) {
    throw new Error("Required deposit cannot be negative.");
  }

  if (depositCents > totalCents) {
    throw new Error("Required deposit cannot exceed the quote total.");
  }

  return {
    subtotal: fromCents(subtotalCents),
    gst: fromCents(gstCents),
    total: fromCents(totalCents),
    depositRequired: fromCents(depositCents),
    balance: fromCents(totalCents - depositCents),
    subtotalCents,
    gstCents,
    totalCents,
    depositCents,
  };
}
