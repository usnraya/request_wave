import { notFound } from "next/navigation";
import TeamDetailView from "@/components/teams/team-detail-view";
import { getCategories, getRequests, getTeams, getUsers } from "@/lib/data";

export default async function TeamDetailPage({
  params,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const [teams, requests, categories, users] = await Promise.all([
    getTeams(),
    getRequests(),
    getCategories(),
    getUsers(),
  ]);
  const team = teams.find((item) => item.id === teamId);
  if (!team) notFound();
  return (
    <TeamDetailView
      team={team}
      requests={requests.filter((request) => request.status === "done" && request.teamId === teamId)}
      categories={categories}
      users={users}
    />
  );
}

export async function generateMetadata({ params }: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const team = (await getTeams()).find((item) => item.id === teamId);
  return { title: team ? `${team.name} | Request Wave` : "Team | Request Wave" };
}
