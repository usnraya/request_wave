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

(async () => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("requests")
    .select("id, notion_id, title, output_count, request_date")
    .gte("request_date", "2026-01-01")
    .lt("request_date", "2027-01-01")
    .order("request_date", { ascending: true });
  if (error) throw error;

  console.log(JSON.stringify({
    year: 2026,
    count: data.length,
    outputTotal: data.reduce((sum, row) => sum + (row.output_count || 0), 0),
    rows: data,
  }, null, 2));

  if (process.argv[2] !== "--delete") {
    console.log("\nPreview only. Run with --delete to remove these rows.");
    return;
  }
  if (!data.length) return;

  const { error: deleteError } = await supabase
    .from("requests")
    .delete()
    .in("id", data.map((row) => row.id));
  if (deleteError) throw deleteError;

  const { data: remaining, error: verifyError } = await supabase
    .from("requests")
    .select("id, notion_id, request_date")
    .gte("request_date", "2026-01-01")
    .lt("request_date", "2027-01-01");
  if (verifyError) throw verifyError;
  if (remaining.length) throw new Error(`Verification failed: ${remaining.length} rows remain`);
  console.log(JSON.stringify({ deleted: data.length, remaining: 0 }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
