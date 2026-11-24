
import test from "node:test";
import assert from "node:assert/strict";

import {
  toCents,
  fromCents,
  addMoney,
  subtractMoney,
  compareMoney,
  validateMoney,
  formatAUD,
} from "../shared/money.js";

test("converts dollar amounts into integer cents", () => {
  assert.equal(toCents("125.50"), 12550);
  assert.equal(toCents("0.01"), 1);
  assert.equal(toCents("250"), 25000);
});

test("converts integer cents into dollars", () => {
  assert.equal(fromCents(12550), 125.5);
  assert.equal(fromCents(1), 0.01);
});

test("adds money without floating-point errors", () => {
  assert.equal(addMoney("0.10", "0.20"), 0.3);
  assert.equal(addMoney("12.35", "7.65"), 20);
  assert.equal(addMoney("10.25", "2.50", "0.25"), 13);
});

test("subtracts money accurately", () => {
  assert.equal(subtractMoney("100.00", "33.33"), 66.67);
  assert.equal(subtractMoney("10.00", "10.00"), 0);
});

test("compares monetary amounts in cents", () => {
  assert.equal(compareMoney("10.10", "10.10"), 0);
  assert.equal(compareMoney("10.09", "10.10"), -1);
  assert.equal(compareMoney("10.11", "10.10"), 1);
});

test("validates permitted monetary ranges", () => {
  assert.equal(validateMoney("25.50"), 25.5);
  assert.equal(validateMoney("0.01", { min: "0.01" }), 0.01);

  assert.throws(
    () => validateMoney("0", { min: "0.01" })
  );

  assert.throws(
    () => validateMoney("101", { max: "100" })
  );
});

test("rejects more than two decimal places", () => {
  assert.throws(() => toCents("12.345"));
  assert.throws(() => toCents("1.005"));
  assert.throws(() => toCents("0.001"));
});

test("rejects invalid monetary values", () => {
  assert.throws(() => toCents(""));
  assert.throws(() => toCents("abc"));
  assert.throws(() => toCents("1,000.00"));
  assert.throws(() => toCents(null));
});

test("formats Australian dollars to exactly two decimal places", () => {
  assert.equal(formatAUD("125"), "$125.00");
  assert.equal(formatAUD("125.5"), "$125.50");
  assert.equal(formatAUD("0.01"), "$0.01");
});

test("supports negative amounts for financial adjustments", () => {
  assert.equal(toCents("-12.50"), -1250);
  assert.equal(addMoney("10.00", "-2.50"), 7.5);
});


test("rejects arithmetic results outside the safe integer-cent range", () => {
  assert.throws(
    () => addMoney("90071992547409.91", "0.01"),
    RangeError
  );

  assert.throws(
    () => subtractMoney("90071992547409.91", "-0.01"),
    RangeError
  );
});

test("checks intermediate addition totals before precision can be lost", () => {
  assert.throws(
    () => addMoney(
      "90071992547409.91",
      "0.01",
      "-0.01"
    ),
    RangeError
  );
});
