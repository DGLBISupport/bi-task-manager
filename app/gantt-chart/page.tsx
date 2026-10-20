"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import TaskForm from "@/components/task-form";
import { useData } from "../lib/useData";
import { Task, STATUS_LABEL, Status } from "../lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ZoomIn,
  ZoomOut,
  Layers,
  Calendar,
  Clock,
  Download,
  FileImage,
  FileSpreadsheet,
  Printer,
} from "lucide-react";

const DAY = 86400000;
const ms = (s: string) => new Date(s + "T00:00:00Z").getTime();

export default function GanttChart() {
  const { tasks, projects, members, loading, reload } = useData();
  const [dw, setDw] = useState(16);
  const [hideDone, setHideDone] = useState(false);
  const [project, setProject] = useState("all");
  const [editing, setEditing] = useState<Task | null>(null);

  const dated = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.start_date || t.end_date) &&
          (!hideDone || t.status !== "done") &&
          (project === "all" || t.project_id === project)
      ),
    [tasks, hideDone, project]
  );

  const range = useMemo(() => {
    if (!dated.length) return null;
    const all = dated.flatMap((t) => [
      ms((t.start_date ?? t.end_date)!),
      ms((t.end_date ?? t.start_date)!),
    ]);
    const min = Math.min(...all) - 3 * DAY;
    const max = Math.max(...all) + 7 * DAY;
    return { min, max, days: Math.max(14, Math.ceil((max - min) / DAY)) };
  }, [dated]);

  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    dated.forEach((t) => {
      const pId = t.project_id || "unassigned";
      m.set(pId, [...(m.get(pId) ?? []), t]);
    });
    return [...m.values()];
  }, [dated]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const months: { label: string; left: number; width: number }[] = [];
  if (range) {
    for (let d = new Date(range.min); d.getTime() < range.max;) {
      const start = Math.max(d.getTime(), range.min);
      const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      months.push({
        label: d.toLocaleString("en", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        left: ((start - range.min) / DAY) * dw,
        width: ((Math.min(next, range.max) - start) / DAY) * dw,
      });
      d = new Date(next);
    }
  }

  const today = Date.now();
  const timelineWidth = range ? range.days * dw : 600;

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "done":
        return "bg-emerald-500 text-white border-emerald-600";
      case "in_progress":
        return "bg-primary text-primary-foreground border-primary/80";
      case "to_confirm":
        return "bg-amber-500 text-white border-amber-600";
      case "upcoming":
      default:
        return "bg-slate-400 dark:bg-slate-600 text-white border-slate-500";
    }
  };

  function downloadAsPNG() {
    if (!range || dated.length === 0) {
      toast.error("No timeline data to download.");
      return;
    }

    try {
      const scale = 2;
      const labelW = 280;
      const rowH = 38;
      const headerH = 75;
      const legendH = 50;

      let totalRows = 0;
      groups.forEach((g) => {
        totalRows += 1;
        totalRows += g.length;
      });

      const contentW = labelW + range.days * dw;
      const totalW = Math.max(1050, contentW);
      const totalH = headerH + totalRows * rowH + legendH;

      const canvas = document.createElement("canvas");
      canvas.width = totalW * scale;
      canvas.height = totalH * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Failed to initialize canvas context.");
        return;
      }

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalW, totalH);

      // Main Header
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("BI Project Task & Gantt Tracker", 20, 30);

      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `Generated on ${new Date().toLocaleDateString()} | ${dated.length} Scheduled Tasks`,
        20,
        52
      );

      // Timeline month headers
      let y = headerH;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, y, totalW, rowH);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(0, y, totalW, rowH);

      ctx.fillStyle = "#334155";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("Task Name", 20, y + 24);

      months.forEach((m) => {
        const x = labelW + m.left;
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(m.label, x + 8, y + 24);
        ctx.strokeStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, totalH - legendH);
        ctx.stroke();
      });

      y += rowH;

      // Draw rows
      groups.forEach((g) => {
        const pName = g[0]?.project_name || "General";

        // Project Header
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, y, totalW, rowH);
        ctx.strokeStyle = "#e2e8f0";
        ctx.strokeRect(0, y, totalW, rowH);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`📁 ${pName} (${g.length} tasks)`, 20, y + 24);

        y += rowH;

        // Tasks
        g.forEach((t) => {
          // Row border
          ctx.strokeStyle = "#f1f5f9";
          ctx.strokeRect(0, y, totalW, rowH);

          // Task label
          ctx.fillStyle = "#1e293b";
          ctx.font = "11px sans-serif";
          const maxLabelLength = 36;
          const labelText =
            t.title.length > maxLabelLength
              ? t.title.slice(0, maxLabelLength) + "…"
              : t.title;
          ctx.fillText(labelText, 20, y + 24);

          // Task Bar
          const s = ms((t.start_date ?? t.end_date)!);
          const e = ms((t.end_date ?? t.start_date)!);
          const barLeft = labelW + ((s - range.min) / DAY) * dw;
          const barW = Math.max(16, ((e - s) / DAY + 1) * dw);
          const barH = 22;
          const barY = y + (rowH - barH) / 2;

          let barColor = "#94a3b8";
          if (t.status === "done") barColor = "#10b981";
          else if (t.status === "in_progress") barColor = "#0284c7";
          else if (t.status === "to_confirm") barColor = "#f59e0b";

          ctx.fillStyle = barColor;
          ctx.beginPath();
          ctx.roundRect(barLeft, barY, barW, barH, 4);
          ctx.fill();

          if (t.progress > 0) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.roundRect(barLeft, barY, (barW * t.progress) / 100, barH, 4);
            ctx.fill();
          }

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          if (barW > 45) {
            ctx.fillText(`${t.progress}%`, barLeft + 6, barY + 15);
          }

          y += rowH;
        });
      });

      // Today line
      if (today >= range.min && today <= range.max) {
        const todayX = labelW + ((today - range.min) / DAY) * dw;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(todayX, headerH);
        ctx.lineTo(todayX, totalH - legendH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("TODAY", todayX - 16, headerH - 6);
      }

      // Legend at bottom
      const legendY = totalH - 24;
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.fillText("Legend:", 20, legendY);

      const items = [
        { label: "Done", color: "#10b981" },
        { label: "In Progress", color: "#0284c7" },
        { label: "To Confirm", color: "#f59e0b" },
        { label: "Upcoming", color: "#94a3b8" },
      ];

      let lx = 80;
      items.forEach((item) => {
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, legendY - 9, 12, 12);
        ctx.fillStyle = "#334155";
        ctx.fillText(item.label, lx + 18, legendY);
        lx += 110;
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gantt-chart-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Gantt chart image downloaded successfully!");
      }, "image/png");
    } catch (e: any) {
      toast.error(e?.message || "Failed to download Gantt chart");
    }
  }

  function downloadAsCSV() {
    if (!dated.length) {
      toast.error("No timeline data to export.");
      return;
    }
    const headers = [
      "Task ID",
      "Task Title",
      "Project",
      "Deliverable",
      "Start Date",
      "End Date",
      "Status",
      "Priority",
      "Progress (%)",
      "Assignees",
    ];
    const csvRows = dated.map((t) => [
      `"${t.id}"`,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${(t.project_name || "").replace(/"/g, '""')}"`,
      `"${(t.deliverable_name || "").replace(/"/g, '""')}"`,
      `"${t.start_date || ""}"`,
      `"${t.end_date || ""}"`,
      `"${STATUS_LABEL[t.status] || t.status}"`,
      `"${t.priority}"`,
      t.progress,
      `"${(t.assignees || []).join(", ").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `gantt-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Gantt schedule exported to CSV!");
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gantt Chart</h1>
          <p className="text-sm text-muted-foreground">
            Visualize project timelines, dependencies, and milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="gap-1.5 py-1">
            <Clock className="size-3.5 text-primary" />
            {dated.length} Scheduled Tasks
          </Badge>

          {/* Download & Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5 shadow-xs">
                <Download className="size-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Export Timeline</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadAsPNG} className="gap-2 cursor-pointer">
                <FileImage className="size-4 text-emerald-600" />
                <span>Download as PNG Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="size-4 text-sky-600" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="gap-2 cursor-pointer">
                <Printer className="size-4 text-slate-600" />
                <span>Print / Save as PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-64">
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name.length > 35 ? p.name.slice(0, 35) + "…" : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="hide-done"
                  checked={hideDone}
                  onCheckedChange={(checked) => setHideDone(Boolean(checked))}
                />
                <Label htmlFor="hide-done" className="text-sm cursor-pointer">
                  Hide completed
                </Label>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-muted-foreground font-medium">Zoom</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setDw((w) => Math.max(8, w - 3))}
                disabled={dw <= 8}
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <span className="text-xs w-8 text-center font-mono">{dw}px</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setDw((w) => Math.min(36, w + 3))}
                disabled={dw >= 36}
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt View */}
      {!range || dated.length === 0 ? (
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Calendar className="size-10 stroke-[1.5]" />
            <p className="text-sm font-medium">No tasks with start or end dates found.</p>
            <p className="text-xs">Add dates to your tasks in Task Management to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto max-h-[70vh] relative">
            <div
              style={{ minWidth: timelineWidth + 288 }}
              className="relative select-none w-full"
            >
              {/* Header Timeline */}
              <div className="sticky top-0 z-20 flex bg-card border-b text-xs font-semibold text-muted-foreground shadow-xs h-10">
                <div className="sticky left-0 z-30 shrink-0 w-72 min-w-72 max-w-72 bg-card border-r px-4 flex items-center font-medium h-10">
                  Task Name
                </div>
                <div className="relative flex-1 h-10">
                  {months.map((m, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 border-r border-border/50 px-2 flex items-center text-[11px] font-medium text-foreground/80 bg-muted/20"
                      style={{ left: m.left, width: m.width }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/40">
                {groups.map((g) => {
                  const pName = g[0]?.project_name || "General";
                  return (
                    <div key={g[0].project_id}>
                      {/* Project Header Row */}
                      <div className="flex bg-muted/40 font-semibold text-xs text-foreground items-center h-10">
                        <div
                          className="sticky left-0 z-10 shrink-0 w-72 min-w-72 max-w-72 bg-muted/80 backdrop-blur-xs border-r px-4 flex items-center gap-1.5 truncate h-10"
                          title={pName}
                        >
                          <Layers className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{pName}</span>
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0 font-normal">
                            {g.length}
                          </Badge>
                        </div>
                        <div className="flex-1 relative h-10" />
                      </div>

                      {/* Task Rows */}
                      {g.map((t) => {
                        const s = ms((t.start_date ?? t.end_date)!);
                        const e = ms((t.end_date ?? t.start_date)!);
                        const left = ((s - range.min) / DAY) * dw;
                        const w = Math.max(16, ((e - s) / DAY + 1) * dw);

                        return (
                          <div
                            key={t.id}
                            className="flex items-center hover:bg-muted/30 transition-colors group h-10"
                          >
                            {/* Sticky Left Label */}
                            <div
                              className="sticky left-0 z-10 shrink-0 w-72 min-w-72 max-w-72 bg-card border-r px-3.5 flex items-center justify-between text-xs font-normal group-hover:bg-muted/40 transition-colors h-10 gap-2"
                              title={`${t.title} (${t.progress}%)`}
                            >
                              <span
                                className="line-clamp-2 leading-tight break-words whitespace-normal cursor-pointer hover:underline text-foreground font-medium flex-1 text-[11px]"
                                onClick={() => setEditing(t)}
                              >
                                {t.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                {t.progress}%
                              </span>
                            </div>

                            {/* Timeline Bar Track */}
                            <div className="flex-1 relative h-full flex items-center">
                              {/* Grid background ticks */}
                              {months.map((m, i) => (
                                <div
                                  key={i}
                                  className="absolute inset-y-0 border-r border-border/30 pointer-events-none"
                                  style={{ left: m.left, width: m.width }}
                                />
                              ))}

                              {/* Task Bar */}
                              <div
                                onClick={() => setEditing(t)}
                                className={`absolute h-6 rounded-md shadow-xs border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex items-center overflow-hidden ${getStatusColor(
                                  t.status
                                )}`}
                                style={{ left, width: w }}
                                title={`${t.title}\nStatus: ${STATUS_LABEL[t.status]}\n${t.start_date ?? "?"
                                  } → ${t.end_date ?? "?"}\nAssignees: ${t.assignees?.join(", ") || "None"
                                  }\nProgress: ${t.progress}%`}
                              >
                                {/* Progress Fill */}
                                <div
                                  className="absolute inset-y-0 left-0 bg-black/20 dark:bg-white/20"
                                  style={{ width: `${t.progress}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-semibold px-2 truncate leading-none">
                                  {t.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Today line */}
              {today >= range.min && today <= range.max && (
                <div
                  className="absolute inset-y-0 pointer-events-none z-20 flex flex-col items-center"
                  style={{
                    left: 288 + ((today - range.min) / DAY) * dw,
                  }}
                >
                  <div className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded shadow-sm -translate-y-1">
                    TODAY
                  </div>
                  <div className="w-0 flex-1 border-r-2 border-dashed border-destructive/80" />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {editing && (
        <TaskForm
          task={editing}
          projects={projects}
          members={members}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}