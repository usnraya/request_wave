export type UserRole = "PM" | "VIEWER";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
};
