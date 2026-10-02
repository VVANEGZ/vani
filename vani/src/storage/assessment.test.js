import test from "node:test";
import assert from "node:assert/strict";
import { assessmentRatio, localDate, validateAssignmentDate, criterionFor, gradeSummary, validateWeight, validTopicName } from "./assessment.js";

test("manual weights contribute course points and pending scores stay ungraded", () => {
  const events = [{ id: "a", peso: 15, realizado: true, formato: "reactivos", resultado: 10, reactivos: 20 }, { id: "b", peso: 25 }];
  assert.deepEqual(gradeSummary(events), { assigned: 40, graded: 15, earned: 7.5 });
  assert.equal(validateWeight(25, "b", events, 40), "");
  assert.notEqual(validateWeight(26, "b", events, 40), "");
  assert.notEqual(validateWeight(-1, "b", events, 40), "");
});

test("legacy assignments match only unambiguous criteria and deleted links stay unlinked", () => {
  const criteria = [{ id: "a", nombre: "Exámenes" }];
  assert.equal(criterionFor({ tipo: "examen" }, criteria), "a");
  assert.equal(criterionFor({ tipo: "examen", criterioId: "removed" }, criteria), null);
  assert.equal(criterionFor({ tipo: "examen" }, [...criteria, { id: "b", nombre: "Examen final" }]), null);
  assert.equal(validTopicName("uno ".repeat(10).trim()), true);
  assert.equal(validTopicName("uno ".repeat(11).trim()), false);
  assert.equal(validTopicName("a".repeat(81)), false);
});

test("equivalent grading formats give the same result", () => {
  assert.equal(assessmentRatio({ realizado: true, formato: "reactivos", resultado: 10, reactivos: 20 }), 0.5);
  assert.equal(assessmentRatio({ realizado: true, formato: "porcentaje", resultado: 50 }), 0.5);
  assert.equal(assessmentRatio({ realizado: true, formato: "calificacion", resultado: 5 }), 0.5);
});
test("ungraded assignments stay unknown, and invalid results never contribute", () => {
  assert.equal(assessmentRatio({ realizado: false, formato: "porcentaje", resultado: 90 }), null);
  assert.equal(assessmentRatio({ realizado: true, formato: "porcentaje", resultado: "" }), null);
  assert.equal(assessmentRatio({ realizado: true, formato: "porcentaje", resultado: 0 }), 0);
  assert.equal(assessmentRatio({ realizado: true, formato: "reactivos", resultado: 5, reactivos: 0 }), null);
  assert.equal(assessmentRatio({ realizado: true, formato: "reactivos", resultado: 21, reactivos: 20 }), null);
});
test("dates use the local day and preserve historical assignments", () => {
  assert.equal(localDate(new Date(2026, 9, 1, 23, 59)), "2026-10-01");
  assert.equal(validateAssignmentDate("2026-09-01", "2026-09-01", "2026-10-01"), "");
  assert.notEqual(validateAssignmentDate("2026-09-30", "", "2026-10-01"), "");
  assert.equal(validateAssignmentDate("2026-10-01", "", "2026-10-01"), "");
});
