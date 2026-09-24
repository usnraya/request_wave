import { getManagedUsers } from "@/lib/data";
import UsersManager from "@/components/manage/users-manager";

export default async function ManageUsersPage() {
  const users = await getManagedUsers();
  return <UsersManager users={users} />;
}

export const metadata = { title: "Users | Request Wave" };
