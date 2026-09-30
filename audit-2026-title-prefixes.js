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

function prefix(title) {
  return title.trim().match(/^[\p{L}\p{N}]+/u)?.[0] || title.trim().split(/\s+/)[0] || "(blank)";
}

(async () => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("requests")
      .select("notion_id, title, output_count, request_date")
      .gte("request_date", "2026-01-01")
      .lt("request_date", "2027-01-01")
      .order("request_date", { ascending: true })
      .order("notion_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  const matches = rows.filter((row) => !/^\s*(design|edit)\b/i.test(row.title));
  const countsByPrefix = {};
  for (const row of matches) {
    const key = prefix(row.title).toLowerCase();
    countsByPrefix[key] = (countsByPrefix[key] || 0) + 1;
  }

  console.log(JSON.stringify({
    total2026: rows.length,
    designOrEdit: rows.length - matches.length,
    outsideDesignOrEdit: matches.length,
    countsByPrefix,
  }, null, 2));
  console.log("\n---MATCHES---");
  for (const row of matches) {
    console.log(`${row.request_date.slice(0, 7)}\t${row.notion_id}\t${row.title}\toutput=${row.output_count}\tprefix=${prefix(row.title)}`);
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
