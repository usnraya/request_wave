/** Run with: npx tsx lib/dashboard-utils.check.ts */
import assert from "node:assert/strict";
import { getHeatLevel } from "./dashboard-utils";

assert.equal(getHeatLevel(null, 10), 0, "future month is neutral");
assert.equal(getHeatLevel(0, 10), 0, "zero is neutral");
assert.equal(getHeatLevel(5, 10), 2, "half maximum is level 2");
assert.equal(getHeatLevel(10, 10), 4, "maximum is darkest");
assert.equal(getHeatLevel(1, 100), 1, "small positive count remains visible");
assert.equal(getHeatLevel(1, 0), 0, "empty scale is neutral");
assert.equal(getHeatLevel(20, 10), 4, "level is capped");

console.log("dashboard-utils: OK");
