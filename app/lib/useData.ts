"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Member, Project, Task } from "./types";

export function useData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [t, p, m] = await Promise.all([
      supabase.from("task_manager_task_overview").select("*")
        .order("priority_rank", { ascending: true, nullsFirst: false })
        .order("end_date", { ascending: true }),
      supabase.from("task_manager_projects").select("*").order("name"),
      supabase.from("task_manager_team_members").select("id,name").eq("is_active", true).order("name"),
    ]);
    const err = t.error || p.error || m.error;
    if (err) setError(err.message);
    setTasks((t.data as Task[]) ?? []);
    setProjects((p.data as Project[]) ?? []);
    setMembers((m.data as Member[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { tasks, projects, members, loading, error, reload: load };
}
