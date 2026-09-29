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
  const { data: candidates, error } = await supabase
    .from("requests")
    .select("id, notion_id, title, output_count, request_date")
    .ilike("title", "Post%")
    .order("request_date", { ascending: true });
  if (error) throw error;
  // Word-boundary prefix match: "Post - ..." / "Poster ..." must not match "Poster".
  const data = candidates.filter((r) => /^\s*post\b/i.test(r.title));

  console.log(JSON.stringify({
    matchCount: data.length,
    outputTotal: data.reduce((s, r) => s + r.output_count, 0),
    rows: data.map((r) => `${r.notion_id}\t${r.title}\toutput=${r.output_count}\tdate=${r.request_date}`),
  }, null, 2));

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
