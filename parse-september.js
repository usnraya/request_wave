const fs = require("fs");

function parseRows() {
  const lines = fs.readFileSync("md/september.md", "utf8").split(/\r?\n/);
  return lines.flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line
      .replace(/\\\|/g, "\u0001")
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed source row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    return [{ notionId, title, outputText, outputCount: Number(outputText), usage, workAreaText }];
  });
}

function firstTeam(usage) {
  if (usage.trim() === "[Timedoor Academy] C-Level") return "[Timedoor Academy] C-Level";
  const part = usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "));
  return part ? part.slice("[Team] ".length).trim() : null;
}

function firstArea(workAreaText) {
  const a = workAreaText.split(",")[0].trim();
  return a || null;
}

const rows = parseRows();
const zero = rows.filter((r) => !Number.isInteger(r.outputCount) || r.outputCount < 1);
const positive = rows.filter((r) => Number.isInteger(r.outputCount) && r.outputCount >= 1);

const missingTeam = [];
const missingArea = [];
const ready = [];

for (const r of positive) {
  const team = firstTeam(r.usage);
  const area = firstArea(r.workAreaText);
  if (!team) missingTeam.push({ ...r, team, area });
  else if (!area) missingArea.push({ ...r, team, area });
  else ready.push({ ...r, team, area });
}

console.log(JSON.stringify({
  totalRows: rows.length,
  zeroCount: zero.length,
  positiveCount: positive.length,
  positiveOutputSum: positive.reduce((s, r) => s + r.outputCount, 0),
  readyCount: ready.length,
  readyOutputSum: ready.reduce((s, r) => s + r.outputCount, 0),
  missingTeamCount: missingTeam.length,
  missingAreaCount: missingArea.length,
}, null, 2));

console.log("\n---ZERO OUTPUT---");
for (const r of zero) console.log(`${r.notionId}\t${r.title}`);

console.log("\n---MISSING TEAM (output>=1)---");
for (const r of missingTeam) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tusage="${r.usage}"\tarea="${r.workAreaText}"`);

console.log("\n---HAS TEAM, MISSING AREA (output>=1)---");
for (const r of missingArea) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tteam=${r.team}`);

console.log("\n---READY teams used---");
console.log([...new Set(ready.map((r) => r.team))].join(" | "));
console.log("\n---READY areas used---");
console.log([...new Set(ready.map((r) => r.area))].join(" | "));

console.log("\n---READY rows---");
for (const r of ready) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tteam=${r.team}\tarea=${r.area}`);
