import TeamsClient from "@/components/teams/teams-client";
import { getCategories, getRequests, getTeams } from "@/lib/data";

export default async function TeamsPage() {
  const [requests, categories, teams] = await Promise.all([
    getRequests(),
    getCategories(),
    getTeams(),
  ]);
  return (
    <TeamsClient
      requests={requests}
      categories={categories}
      teams={teams}
    />
  );
}
