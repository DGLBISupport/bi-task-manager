"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "./lib/useData";
import { Task, Priority, Status, STATUS_LABEL } from "./lib/types";
import TaskForm from "@/components/task-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  Plus,
  CalendarRange,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const { tasks, projects, members, loading, reload } = useData();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const upcoming = tasks.filter((t) => t.status === "upcoming").length;
    const critical = tasks.filter((t) => t.priority === "critical" && t.status !== "done").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, upcoming, critical, completionRate };
  }, [tasks]);

  const projectSummaries = useMemo(() => {
    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.project_id === p.id);
      const pDone = pTasks.filter((t) => t.status === "done").length;
      const progress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
      return {
        ...p,
        totalTasks: pTasks.length,
        doneTasks: pDone,
        progress,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [projects, tasks]);

  const urgentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const order: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      })
      .slice(0, 5);
  }, [tasks]);

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="warning">High</Badge>;
      case "medium":
        return <Badge variant="info">Medium</Badge>;
      case "low":
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (s: Status) => {
    switch (s) {
      case "done":
        return <Badge variant="success">Done</Badge>;
      case "in_progress":
        return <Badge variant="info">In Progress</Badge>;
      case "to_confirm":
        return <Badge variant="warning">To Confirm</Badge>;
      case "upcoming":
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            High-level overview of project deliverables, workloads, and critical paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <Link href="/gantt-chart">
              <CalendarRange className="size-4" />
              Timeline
            </Link>
          </Button>
          <Button onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{projects.length} Active Projects</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {stats.inProgress}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.upcoming} upcoming queued
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Completion rate</span>
                <span>{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-destructive/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Attention</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.critical}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              High-impact blocker tasks
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Projects Breakdown + Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Project Progress Cards */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Project Status</CardTitle>
              <CardDescription>Deliverable progress across active BI systems</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link href="/task-management">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectSummaries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No projects registered yet.</p>
            ) : (
              projectSummaries.slice(0, 5).map((p) => (
                <div key={p.id} className="p-3 rounded-lg border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {p.category || "General"}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {p.doneTasks}/{p.totalTasks} tasks
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Priority Focus */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Urgent Tasks</CardTitle>
              <CardDescription>Highest priority tasks pending execution</CardDescription>
            </div>
            <Badge variant="destructive" className="font-normal text-[11px]">
              {urgentTasks.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {urgentTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  All high-priority tasks are completed!
                </p>
              ) : (
                urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col gap-1.5"
                    onClick={() => setEditing(t)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-xs leading-snug line-clamp-1 hover:underline">
                        {t.title}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[150px]">{t.project_name}</span>
                      <div className="flex items-center gap-2">
                        <span>{t.progress}%</span>
                        {getStatusBadge(t.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
