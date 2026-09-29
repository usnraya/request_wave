const fs = require("fs");

function parseRows() {
  const lines = fs.readFileSync("md/oktober.md", "utf8").split(/\r?\n/);
  return lines.flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    return [{ notionId, title, outputCount: Number(outputText), usage, workAreaText }];
  });
}
function firstTeam(usage) {
  if (usage.trim() === "[Timedoor Academy] C-Level") return "[Timedoor Academy] C-Level";
  const part = usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "));
  return part ? part.slice("[Team] ".length).trim() : null;
}
function firstArea(t) { return t.split(",")[0].trim() || null; }

const rows = parseRows();
const positive = rows.filter((r) => Number.isInteger(r.outputCount) && r.outputCount >= 1);
const pending = positive.filter((r) => !firstTeam(r.usage) || !firstArea(r.workAreaText));

const plainTimedoorMissingTeamOnly = pending.filter((r) => !firstTeam(r.usage) && r.usage.trim() === "Timedoor Academy" && firstArea(r.workAreaText));
const plainTimedoorMissingBoth = pending.filter((r) => !firstTeam(r.usage) && r.usage.trim() === "Timedoor Academy" && !firstArea(r.workAreaText));
const teamKnownAreaMissing = pending.filter((r) => firstTeam(r.usage) && !firstArea(r.workAreaText));
const other = pending.filter((r) => !firstTeam(r.usage) && r.usage.trim() !== "Timedoor Academy");

console.log("total pending:", pending.length);
console.log("\n== A: usage exactly 'Timedoor Academy', area present -> team=Timedoor Academy applies cleanly (" + plainTimedoorMissingTeamOnly.length + ") ==");
for (const r of plainTimedoorMissingTeamOnly) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tarea="${r.workAreaText}"`);

console.log("\n== B: usage exactly 'Timedoor Academy', area ALSO empty -> team resolved, area still needed (" + plainTimedoorMissingBoth.length + ") ==");
for (const r of plainTimedoorMissingBoth) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}`);

console.log("\n== C: Team already resolved via [Team] tag, only Work Area missing -> unaffected by 'timedoor' rule (" + teamKnownAreaMissing.length + ") ==");
for (const r of teamKnownAreaMissing) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tusage="${r.usage}"`);

console.log("\n== D: usage is something else (not Timedoor Academy, no [Team] tag) -> still needs manual Team (" + other.length + ") ==");
for (const r of other) console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tusage="${r.usage}"\tarea="${r.workAreaText}"`);
