/** Run with: npx tsx lib/dashboard-utils.check.ts */
import assert from "node:assert/strict";
import {
  getHeatLevel,
  getMonthlyCategoryRequests,
  getMonthlyTeamRequests,
  getRequestCountByCategory,
  getRequestsThisMonth,
  getTotalMonthlyRequests,
  getTotalOutputs,
  getTotalRequests,
  getMonthRange,
} from "./dashboard-utils";
import { monthKey, today } from "./date-utils";
import type { Request } from "@/types/request";

assert.equal(getHeatLevel(null, 10), 0, "future month is neutral");
assert.equal(getHeatLevel(0, 10), 0, "zero is neutral");
assert.equal(getHeatLevel(5, 10), 2, "half maximum is level 2");
assert.equal(getHeatLevel(10, 10), 4, "maximum is darkest");
assert.equal(getHeatLevel(1, 100), 1, "small positive count remains visible");
assert.equal(getHeatLevel(1, 0), 0, "empty scale is neutral");
assert.equal(getHeatLevel(20, 10), 4, "level is capped");

const current = today();
const currentMonth = monthKey(current);
const request: Request = {
  id: "request-1",
  requestCode: "REQ-1",
  notionId: "notion-1",
  title: "Five outputs",
  teamId: "team-1",
  categoryId: "category-1",
  requesterId: "user-1",
  requestDate: `${currentMonth}-10`,
  deadline: `${currentMonth}-20`,
  priority: "medium",
  status: "done",
  estimatedHours: 0,
  outputCount: 5,
};
const requests = [request];
const months = getMonthRange(current.getFullYear());
const currentPoint = (points: { key: string; count: number | null }[]) =>
  points.find((point) => point.key === currentMonth);

assert.equal(getTotalOutputs(requests), 5, "total outputs sum quantities");
assert.equal(getTotalRequests(requests), 5, "total requests uses output total");
assert.equal(getRequestsThisMonth(requests), 5, "this month sums quantities");
assert.equal(getRequestCountByCategory(requests, "category-1"), 5, "category count sums quantities");
assert.equal(currentPoint(getTotalMonthlyRequests(requests, months))?.count, 5, "monthly total sums quantities");
assert.equal(currentPoint(getMonthlyTeamRequests(requests, "team-1", months))?.count, 5, "team month sums quantities");
assert.equal(currentPoint(getMonthlyCategoryRequests(requests, "category-1", months))?.count, 5, "category month sums quantities");

console.log("dashboard-utils: OK");
