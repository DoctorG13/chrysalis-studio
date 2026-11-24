import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateInvoiceAmountCents,
  calculateLineItemsCents,
  calculateQuoteAmounts,
  reconcileInvoiceCents,
} from "../shared/invoice-quote-money.js";

test("calculates invoice line items in exact cents", () => {
  assert.equal(
    calculateInvoiceAmountCents({
      lineItems: [
        { quantity: 2, rate: "12.35" },
        { quantity: 1, rate: "5.10" },
      ],
    }),
    2980
  );
});

test("rejects invoice amounts with more than two decimal places", () => {
  assert.throws(
    () => calculateInvoiceAmountCents({ amount: "100.005" }),
    /no more than two decimal places/
  );
});

test("rejects conflicting invoice amount and total", () => {
  assert.throws(
    () => calculateInvoiceAmountCents({ amount: "100.00", total: "99.99" }),
    /must match/
  );
});

test("rejects line items that cannot resolve to exact cents", () => {
  assert.throws(
    () => calculateLineItemsCents([{ quantity: 0.5, rate: "10.01" }]),
    /exact amount of cents/
  );
});

test("reconciles invoice payments and refunds using cents", () => {
  assert.deepEqual(
    reconcileInvoiceCents(12550, [
      { amount: "55.25", isRefund: false },
      { amount: "15.25", isRefund: true },
    ]),
    { amountPaid: 40, balance: 85.5, netPaidCents: 4000 }
  );
});

test("rejects payment precision errors during invoice reconciliation", () => {
  assert.throws(
    () => reconcileInvoiceCents(10000, [{ amount: "10.005", isRefund: false }]),
    /no more than two decimal places/
  );
});

test("calculates quote subtotal, GST, total, deposit and balance", () => {
  assert.deepEqual(
    calculateQuoteAmounts({
      lineItems: [{ quantity: 2, rate: "50.00" }],
      subtotal: "100.00",
      gst: "10.00",
      total: "110.00",
      depositRequired: "25.00",
    }),
    {
      subtotal: 100,
      gst: 10,
      total: 110,
      depositRequired: 25,
      balance: 85,
      subtotalCents: 10000,
      gstCents: 1000,
      totalCents: 11000,
      depositCents: 2500,
    }
  );
});

test("rejects quote line-item precision errors", () => {
  assert.throws(
    () => calculateQuoteAmounts({ lineItems: [{ quantity: 1, rate: "10.001" }] }),
    /no more than two decimal places/
  );
});

test("rejects a quote subtotal that disagrees with line items", () => {
  assert.throws(
    () => calculateQuoteAmounts({
      lineItems: [{ quantity: 1, rate: "100.00" }],
      subtotal: "99.00",
    }),
    /does not match/
  );
});

test("rejects a quote total that disagrees with subtotal plus GST", () => {
  assert.throws(
    () => calculateQuoteAmounts({
      subtotal: "100.00",
      gst: "10.00",
      total: "109.99",
    }),
    /must equal subtotal plus GST/
  );
});

test("rejects deposits greater than the quote total", () => {
  assert.throws(
    () => calculateQuoteAmounts({
      subtotal: "100.00",
      gst: "10.00",
      depositRequired: "110.01",
    }),
    /cannot exceed/
  );
});

test("rejects an invoice amount that disagrees with its line items", () => {
  assert.throws(
    () => calculateInvoiceAmountCents({
      amount: "125.50",
      lineItems: [{ quantity: 2, rate: "50.25" }],
    }),
    /does not match the line-item calculations/
  );
});

test("rejects an invoice total that disagrees with its line items", () => {
  assert.throws(
    () => calculateInvoiceAmountCents({
      total: "125.50",
      lineItems: [{ quantity: 2, rate: "50.25" }],
    }),
    /does not match the line-item calculations/
  );
});

test("continues to accept manual invoices without line items", () => {
  assert.equal(
    calculateInvoiceAmountCents({ amount: "125.50", lineItems: [] }),
    12550
  );
});
