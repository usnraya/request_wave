export const requestStatuses = [
  "new",
  "in_progress",
  "waiting_feedback",
  "revision",
  "done",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const requestPriorities = ["low", "medium", "high", "urgent"] as const;
export type RequestPriority = (typeof requestPriorities)[number];

export type Request = {
  id: string;
  requestCode: string;
  notionId: string;
  title: string;
  teamId: string;
  categoryId: string;
  requesterId: string;
  designerId?: string;
  requestDate: string;
  deadline: string;
  completedDate?: string;
  priority: RequestPriority;
  status: RequestStatus;
  estimatedHours: number;
  actualHours?: number;
  description?: string;
  figmaUrl?: string;
  driveUrl?: string;
};
