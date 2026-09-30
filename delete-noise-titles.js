const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

// Each pattern targets a whole class of non-deliverable/noise titles the user asked to purge.
const patterns = {
  take: /^\s*take\b/i,               // "Take Content...", "Take Video..."
  dayOff: /day\s*off/i,              // "Day Off", "Day off"
  lastDay: /last\s*day/i,            // "LAST DAY - Elya", "Last Day Work"
  reviewIntern: /review\s*intern/i,  // "LAST REVIEW INTERN - Rekap..."
  discuss: /discuss/i,               // "Discuss - ...", "🟡 Discuss - ..."
  scripting: /^\s*scripting\b/i,     // "Scripting Content Carousel"
  listPortfolio: /\[week\]\s*\[month\]\s*2025\s*-\s*list portfolio/i, // "[Week] [Month] 2025 - List portfolio"
};

(async () => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: all, error } = await supabase
    .from("requests")
    .select("id, notion_id, title, output_count, request_date")
    .order("request_date", { ascending: true });
  if (error) throw error;

  const matchesByPattern = Object.fromEntries(
    Object.entries(patterns).map(([name, regex]) => [name, all.filter((r) => regex.test(r.title))]),
  );

  const byId = new Map();
  for (const rows of Object.values(matchesByPattern)) for (const r of rows) byId.set(r.id, r);
  const data = [...byId.values()];

  console.log(JSON.stringify({
    countsByPattern: Object.fromEntries(Object.entries(matchesByPattern).map(([name, rows]) => [name, rows.length])),
    totalMatched: data.length,
    outputTotal: data.reduce((s, r) => s + r.output_count, 0),
  }, null, 2));

  console.log("\n---MATCHED ROWS (would be deleted)---");
  for (const r of data.sort((a, b) => a.request_date.localeCompare(b.request_date))) {
    console.log(`${r.notion_id}\t${r.title}\toutput=${r.output_count}\tdate=${r.request_date}`);
  }

  if (process.argv[2] === "--delete") {
    const ids = data.map((r) => r.id);
    if (ids.length) {
      const { error: deleteError } = await supabase.from("requests").delete().in("id", ids);
      if (deleteError) throw deleteError;
    }
    console.log(JSON.stringify({ deleted: ids.length }, null, 2));
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
