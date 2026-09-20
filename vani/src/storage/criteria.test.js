import test from "node:test";
import assert from "node:assert/strict";
import { criteriaTotal, normalizePercentageDraft, validatePercentage } from "./criteria.js";

test("replaces leading zero while preserving decimals and empty drafts", () => {
  for (const [input, expected] of [["020", "20"], ["02", "2"], ["00020", "20"], ["0.5", "0.5"], ["0,5", "0,5"], ["", ""], ["0", "0"]]) {
    assert.equal(normalizePercentageDraft(input), expected);
  }
});

test("validates replacement against other criteria and allows exact totals", () => {
  const rows = [{ id: "a", porcentaje: 40 }, { id: "b", porcentaje: 60 }];
  assert.equal(validatePercentage(rows, "a", "40"), "");
  assert.equal(validatePercentage(rows, "a", "0"), "");
  assert.match(validatePercentage(rows, "a", "41"), /100%/);
  assert.match(validatePercentage(rows, "new", "1"), /100%/);
  assert.equal(criteriaTotal(rows), 100);
});

test("handles decimal precision and rejects invalid values", () => {
  const rows = [{ id: "a", porcentaje: 33.33 }, { id: "b", porcentaje: 33.33 }];
  assert.equal(validatePercentage(rows, "c", "33,34"), "");
  assert.match(validatePercentage(rows, "c", "33.35"), /100%/);
  for (const draft of ["", "-1", "101", "NaN", "Infinity", "1e2", "1.234"]) {
    assert.notEqual(validatePercentage([], "a", draft), "");
  }
});
