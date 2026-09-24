import { getTeams } from "@/lib/data";
import TeamsManager from "@/components/manage/teams-manager";

export default async function ManageTeamsPage() {
  const teams = await getTeams();
  return <TeamsManager teams={teams} />;
}

export const metadata = { title: "Teams | Request Wave" };
