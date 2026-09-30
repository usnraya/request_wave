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

const matchesPrefix = (title) =>
  /^[^\p{L}\p{N}]*(post|meeting|discuss)\b/iu.test(title);

async function read2026Requests(supabase) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("requests")
      .select("id, notion_id, title, output_count, request_date")
      .gte("request_date", "2026-01-01")
      .lt("request_date", "2027-01-01")
      .order("request_date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const targets = (await read2026Requests(supabase)).filter((row) =>
    matchesPrefix(row.title),
  );

  console.log(JSON.stringify({
    year: 2026,
    matched: targets.length,
    outputTotal: targets.reduce((sum, row) => sum + row.output_count, 0),
  }, null, 2));
  for (const row of targets) {
    console.log(`${row.request_date}\t${row.notion_id}\t${row.title}\toutput=${row.output_count}`);
  }

  if (process.argv[2] !== "--delete") {
    console.log("\nPreview only. Run with --delete to remove these rows.");
    return;
  }

  for (let index = 0; index < targets.length; index += 500) {
    const ids = targets.slice(index, index + 500).map((row) => row.id);
    const { error } = await supabase.from("requests").delete().in("id", ids);
    if (error) throw error;
  }

  const remaining = (await read2026Requests(supabase)).filter((row) =>
    matchesPrefix(row.title),
  );
  if (remaining.length) {
    throw new Error(`Verification failed: ${remaining.length} matching rows remain`);
  }
  console.log(JSON.stringify({ deleted: targets.length, remaining: 0 }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
