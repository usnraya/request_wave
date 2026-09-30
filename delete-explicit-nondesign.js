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

const notionIds = [
  "DESIGN-1291", "DESIGN-1392", "DESIGN-1454", "DESIGN-1490", "DESIGN-1508",
  "DESIGN-1516", "DESIGN-1590", "DESIGN-1612", "DESIGN-1774", "DESIGN-1772",
  "DESIGN-1785", "DESIGN-1838", "DESIGN-1876", "DESIGN-1889", "DESIGN-1892",
  "DESIGN-1906", "DESIGN-2015", "DESIGN-2025", "DESIGN-2037", "DESIGN-2083",
  "DESIGN-2086", "DESIGN-2137", "DESIGN-1947", "DESIGN-2096", "DESIGN-2158",
  "DESIGN-2172", "DESIGN-2168", "DESIGN-2174", "DESIGN-2181", "DESIGN-2200",
  "DESIGN-2222", "DESIGN-2215", "DESIGN-2233", "DESIGN-2224", "DESIGN-2227",
  "DESIGN-2247", "DESIGN-2262", "DESIGN-2257", "DESIGN-2328", "DESIGN-2327",
  "DESIGN-2382", "DESIGN-2416", "DESIGN-2437", "DESIGN-2443", "DESIGN-2473",
];

(async () => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("requests")
    .select("id, notion_id, title, output_count, request_date")
    .in("notion_id", notionIds);
  if (error) throw error;

  const foundIds = new Set((data || []).map((row) => row.notion_id));
  const missing = notionIds.filter((id) => !foundIds.has(id));
  if (missing.length) throw new Error(`Missing target IDs: ${missing.join(", ")}`);
  if (data.length !== notionIds.length) throw new Error(`Expected ${notionIds.length} rows, found ${data.length}`);

  console.log(JSON.stringify({
    targetCount: notionIds.length,
    matchedCount: data.length,
    outputTotal: data.reduce((sum, row) => sum + row.output_count, 0),
    rows: data.map((row) => `${row.notion_id}\t${row.title}\toutput=${row.output_count}\tdate=${row.request_date}`),
  }, null, 2));

  const { error: deleteError } = await supabase
    .from("requests")
    .delete()
    .in("id", data.map((row) => row.id));
  if (deleteError) throw deleteError;

  const { data: remaining, error: verifyError } = await supabase
    .from("requests")
    .select("id, notion_id")
    .in("notion_id", notionIds);
  if (verifyError) throw verifyError;
  if (remaining.length) throw new Error(`Verification failed: ${remaining.length} targets remain`);
  console.log(JSON.stringify({ deleted: data.length, remaining: 0 }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
