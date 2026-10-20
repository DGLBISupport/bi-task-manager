export type Status = "upcoming" | "in_progress" | "done" | "to_confirm";
export type Priority = "critical" | "high" | "medium" | "low";

export interface Task {
  id: string; project_id: string; deliverable_id: string | null; title: string;
  priority: Priority; status: Status; start_date: string | null; end_date: string | null;
  progress: number; comments: string | null; category: string; project_name: string;
  priority_rank: number | null; deliverable_name: string | null; assignees: string[];
}
export interface Project { id: string; category: string; name: string; priority_rank: number | null }
export interface Member { id: string; name: string }

export const STATUS_LABEL: Record<Status, string> = {
  upcoming: "Upcoming", in_progress: "In progress", done: "Done", to_confirm: "To confirm",
};
export const STATUSES = Object.keys(STATUS_LABEL) as Status[];
export const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];
