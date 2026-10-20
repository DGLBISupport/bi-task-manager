"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/app/lib/supabase";
import { Member, PRIORITIES, Project, STATUS_LABEL, STATUSES, Task, Priority, Status } from "@/app/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface Props {
  task: Task | null;
  projects: Project[];
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskForm({ task, projects, members, onClose, onSaved }: Props) {
  const [f, setF] = useState({
    title: task?.title ?? "",
    project_id: task?.project_id ?? projects[0]?.id ?? "__new",
    priority: (task?.priority ?? "medium") as Priority,
    status: (task?.status ?? "upcoming") as Status,
    start_date: task?.start_date ?? "",
    end_date: task?.end_date ?? "",
    progress: task?.progress ?? 0,
    comments: task?.comments ?? "",
  });

  const [sel, setSel] = useState<string[]>(
    members.filter((m) => task?.assignees?.includes(m.name)).map((m) => m.id)
  );
  const [newProj, setNewProj] = useState("");
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setField = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");

    try {
      let projectId = f.project_id;
      if (projectId === "__new") {
        if (!newProj.trim()) {
          setErr("Please enter a project name.");
          setBusy(false);
          return;
        }
        const { data, error } = await supabase
          .from("projects")
          .insert({ name: newProj.trim(), category: newCat.trim() || "General" })
          .select()
          .single();

        if (error) {
          setErr(error.message);
          toast.error(`Project creation failed: ${error.message}`);
          setBusy(false);
          return;
        }
        projectId = data.id;
      }

      const row = {
        title: f.title.trim(),
        project_id: projectId,
        priority: f.priority,
        status: f.status,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        progress: Number(f.progress),
        comments: f.comments.trim() || null,
      };

      const res = task
        ? await supabase.from("tasks").update(row).eq("id", task.id).select().single()
        : await supabase.from("tasks").insert(row).select().single();

      if (res.error) {
        setErr(res.error.message);
        toast.error(`Failed to save task: ${res.error.message}`);
        setBusy(false);
        return;
      }

      await supabase.from("task_assignees").delete().eq("task_id", res.data.id);
      if (sel.length) {
        await supabase
          .from("task_assignees")
          .insert(sel.map((m) => ({ task_id: res.data.id, member_id: m })));
      }

      toast.success(task ? "Task updated successfully" : "Task created successfully");
      onSaved();
    } catch (e: any) {
      const msg = e?.message || "An unexpected error occurred.";
      setErr(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details and progress for this task." : "Create a new task and assign it to team members."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              required
              placeholder="e.g. Implement revenue forecast model"
              value={f.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-project">Project</Label>
            <Select
              value={f.project_id}
              onValueChange={(val) => setField("project_id", val)}
            >
              <SelectTrigger id="task-project" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem value="__new">+ New project…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {f.project_id === "__new" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/40">
              <div className="space-y-1.5">
                <Label htmlFor="new-project-name">Project Name</Label>
                <Input
                  id="new-project-name"
                  required
                  placeholder="e.g. Q3 Analytics Platform"
                  value={newProj}
                  onChange={(e) => setNewProj(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-project-cat">Category</Label>
                <Input
                  id="new-project-cat"
                  placeholder="e.g. Finance, Marketing, BI"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={f.priority}
                onValueChange={(val) => setField("priority", val)}
              >
                <SelectTrigger id="task-priority" className="w-full capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={f.status}
                onValueChange={(val) => setField("status", val)}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-start">Start Date</Label>
              <Input
                id="task-start"
                type="date"
                value={f.start_date}
                onChange={(e) => setField("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-end">End Date</Label>
              <Input
                id="task-end"
                type="date"
                value={f.end_date}
                onChange={(e) => setField("end_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-progress">Progress ({f.progress}%)</Label>
              <Input
                id="task-progress"
                type="number"
                min={0}
                max={100}
                value={f.progress}
                onChange={(e) => setField("progress", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-lg border p-3 max-h-36 overflow-y-auto bg-muted/20">
              {members.length === 0 ? (
                <span className="text-xs text-muted-foreground col-span-full">No team members found</span>
              ) : (
                members.map((m) => {
                  const isChecked = sel.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-xs font-normal cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          setSel((prev) =>
                            checked
                              ? [...prev, m.id]
                              : prev.filter((id) => id !== m.id)
                          );
                        }}
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-comments">Comments / Notes</Label>
            <Textarea
              id="task-comments"
              rows={2}
              placeholder="Add any notes or context..."
              value={f.comments}
              onChange={(e) => setField("comments", e.target.value)}
            />
          </div>

          {err && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {err}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {busy ? "Saving…" : "Save Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
