import type { UserRole } from "@/types/user";

export type ManagedUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  initials: string;
};
