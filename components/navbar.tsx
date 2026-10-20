"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-2.5">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          BI Task & Gantt Manager
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}