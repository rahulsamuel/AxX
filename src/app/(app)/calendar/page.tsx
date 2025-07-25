
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { CalendarFilters } from "@/components/calendar-filters";
import type { TeamMember, ProjectStatus } from "@/lib/data";
import { getTeamMembers } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";

export interface CalendarFilterState {
  status: ProjectStatus[];
  members: string[];
  eventTypes: string[];
}

export default function CalendarPage() {
  const searchParams = useSearchParams();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<CalendarFilterState>({
    status: ["Completed", "In Progress", "Planning", "On Hold", "Setup"],
    members: [],
    eventTypes: ["Projects", "Training", "PTO"],
  });
  
  useEffect(() => {
    async function fetchData() {
        const members = await getTeamMembers();
        setTeamMembers(members);
        setLoading(false);
    }
    fetchData();
  }, []);

  const { view, date } = useMemo(() => {
    const view = searchParams.get('view') || 'month';
    let date: Date;

    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        const [year, month, day] = dateParam.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        date = dateParam ? new Date(dateParam) : new Date();
    }

    if (isNaN(date.getTime())) {
        date = new Date();
    }
    
    const validViews = ['day', 'week', 'month', 'year'];
    const safeView = validViews.includes(view) ? view : 'month';
    return { view: safeView, date };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
        </header>
        <div className="flex flex-1 gap-6 -mt-6 pt-6 overflow-hidden">
          <aside className="w-64 hidden lg:block">
            <Skeleton className="h-[400px] w-full" />
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden">
            <Skeleton className="h-full w-full" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
        <div>
          <h1 className="text-3xl font-bold">Event Calendar</h1>
          <p className="text-muted-foreground">
            Manage event timelines and staff schedules
          </p>
        </div>
      </header>
      
      <div className="flex flex-1 gap-6 -mt-6 pt-6 overflow-hidden">
        <aside className="w-64 hidden lg:block">
           <CalendarFilters 
             staff={teamMembers} 
             selectedFilters={filters}
             onFilterChange={setFilters} 
           />
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
           <CalendarView 
             view={view as 'day' | 'week' | 'month' | 'year'} 
             date={date}
             filters={filters}
             teamMembers={teamMembers}
           />
        </main>
      </div>
    </div>
  );
}
