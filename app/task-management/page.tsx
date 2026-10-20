"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useData } from "../lib/useData";
import { Status, STATUS_LABEL, STATUSES, Task, Priority } from "../lib/types";
import { supabase } from "../lib/supabase";
import TaskForm from "@/components/task-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  FilterX,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TaskManagement() {
  const { tasks, projects, members, loading, error, reload } = useData();
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState("all");
  const [who, setWho] = useState("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!q ||
            t.title.toLowerCase().includes(q.toLowerCase()) ||
            t.project_name?.toLowerCase().includes(q.toLowerCase())) &&
          (project === "all" || t.project_id === project) &&
          (status === "all" || t.status === status) &&
          (who === "all" || t.assignees?.includes(who))
      ),
    [tasks, q, project, status, who]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);
  const paginatedRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex]
  );

  const isFiltered = q !== "" || project !== "all" || status !== "all" || who !== "all";

  function clearFilters() {
    setQ("");
    setProject("all");
    setStatus("all");
    setWho("all");
    setPage(1);
  }

  async function setTaskStatus(t: Task, s: Status) {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: s, progress: s === "done" ? 100 : t.progress })
        .eq("id", t.id);

      if (error) {
        toast.error(`Status update failed: ${error.message}`);
        return;
      }
      toast.success(`Task status changed to ${STATUS_LABEL[s]}`);
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    }
  }

  async function remove(t: Task) {
    if (!confirm(`Are you sure you want to delete "${t.title}"?`)) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", t.id);
      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }
      toast.success("Task deleted successfully");
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete task");
    }
  }

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="warning">High</Badge>;
      case "medium":
        return <Badge variant="info">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (s: Status) => {
    switch (s) {
      case "done":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="size-3" />
            Done
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="info" className="gap-1">
            <Clock className="size-3" />
            In Progress
          </Badge>
        );
      case "to_confirm":
        return (
          <Badge variant="warning" className="gap-1">
            <HelpCircle className="size-3" />
            To Confirm
          </Badge>
        );
      case "upcoming":
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="size-3" />
            Upcoming
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-sm text-muted-foreground">
            Filter, organize, and monitor all tasks across BI projects.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm">
          Error loading data: {error}
        </div>
      )}

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search tasks or projects..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            {/* Project Filter */}
            <div className="w-full md:w-52">
              <Select
                value={project}
                onValueChange={(val) => {
                  setProject(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.length > 30 ? p.name.slice(0, 30) + "…" : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Filter */}
            <div className="w-full md:w-44">
              <Select
                value={who}
                onValueChange={(val) => {
                  setWho(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Everyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <FilterX className="size-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tasks</CardTitle>
              <CardDescription>
                Showing {rows.length} of {tasks.length} total tasks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-normal">
                {rows.filter((t) => t.status === "done").length} Completed
              </Badge>
              <Badge variant="outline" className="font-normal">
                {rows.filter((t) => t.status === "in_progress").length} In Progress
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%] min-w-[200px]">Task</TableHead>
                <TableHead className="w-[18%] min-w-[130px]">Project</TableHead>
                <TableHead className="w-[16%] min-w-[120px]">Assignees</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Priority</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Progress</TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">Dates</TableHead>
                <TableHead className="w-[80px] text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Layers className="size-8 stroke-[1.5]" />
                      <p className="text-sm font-medium">No tasks found</p>
                      <p className="text-xs">
                        {isFiltered
                          ? "Try adjusting your search or filters."
                          : "Get started by adding your first task."}
                      </p>
                      {isFiltered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="align-top py-3 font-medium whitespace-normal break-words">
                      <div className="space-y-0.5">
                        <span
                          className="font-semibold text-foreground hover:underline cursor-pointer leading-snug break-words block"
                          onClick={() => setEditing(t)}
                        >
                          {t.title}
                        </span>
                        {t.deliverable_name && (
                          <div className="text-xs text-muted-foreground leading-snug break-words">
                            {t.deliverable_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3 whitespace-normal break-words">
                      <span className="text-xs text-muted-foreground font-medium leading-snug break-words block">
                        {t.project_name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="align-top py-3 whitespace-normal break-words">
                      {t.assignees && t.assignees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.assignees.map((name, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[11px] font-normal px-1.5 py-0 break-words whitespace-normal text-left"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-3 whitespace-nowrap">{getPriorityBadge(t.priority)}</TableCell>
                    <TableCell className="align-top py-3 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-muted"
                          >
                            {getStatusBadge(t.status)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => setTaskStatus(t, s)}
                              className="gap-2"
                            >
                              {getStatusBadge(s)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="align-top py-3 whitespace-nowrap">
                      <div className="w-20 space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{t.progress}%</span>
                        </div>
                        <Progress value={t.progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="size-3 shrink-0" />
                        <span>
                          {t.start_date || t.end_date
                            ? `${t.start_date ?? "—"} → ${t.end_date ?? "—"}`
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(t)}
                          title="Edit Task"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(t)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Task"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {rows.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-6 border-t bg-muted/20">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
                <span className="font-semibold text-foreground">{rows.length}</span> tasks
              </span>

              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-18">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-2">
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
                title="First page"
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                title="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                title="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(totalPages)}
                disabled={currentPage >= totalPages}
                title="Last page"
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {(creating || editing) && (
        <TaskForm
          task={editing}
          projects={projects}
          members={members}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
