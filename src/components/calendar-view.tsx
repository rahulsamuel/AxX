

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  addMonths, 
  subMonths, 
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  max,
  min,
  differenceInDays,
  isSameYear,
  addYears,
  subYears,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { getProjects, getTrainingSessions, getPtoRequests } from '@/lib/database';
import { Project, ProjectStatus, TeamMember, TrainingSession, PtoRequest } from "@/lib/data";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import type { CalendarFilterState } from "@/app/(app)/calendar/page";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

interface CalendarViewProps {
  view?: CalendarViewMode;
  date?: Date;
  filters: CalendarFilterState;
  teamMembers: TeamMember[];
}

type CalendarEvent = {
  id: string;
  type: 'project' | 'training' | 'pto';
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  data: Project | TrainingSession | PtoRequest;
  assignedMembers: TeamMember[];
}

const statusColors: Record<ProjectStatus, string> = {
    "Planning": "bg-purple-500",
    "Setup": "bg-yellow-500",
    "In Progress": "bg-blue-500",
    "Completed": "bg-green-500",
    "On Hold": "bg-gray-500",
};

const eventTypeColors = {
    training: "bg-orange-500",
    pto: "bg-teal-500",
}

// Helper to chunk an array into smaller arrays
const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

type EventLayout = {
  event: CalendarEvent;
  startDay: number;
  span: number;
  lane: number;
};

const MonthView = ({ date, events }: { date: Date, events: CalendarEvent[] }) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = chunk(days, 7);
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate project layouts for each week
  const layoutedWeeks = useMemo(() => {
    return weeks.map(week => {
      const weekStart = startOfDay(week[0]);
      const weekEnd = endOfDay(week[6]);
      const weekInterval = { start: weekStart, end: weekEnd };

      const eventsInWeek = events.filter(e => {
        const { startDate, endDate } = e;
        if (!startDate || !endDate) return false;
        
        const eventStart = startOfDay(startDate);
        const eventEnd = endOfDay(endDate);
        return isWithinInterval(eventStart, weekInterval) || 
            isWithinInterval(eventEnd, weekInterval) ||
            (eventStart < weekStart && eventEnd > weekEnd);
      });

      eventsInWeek.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      const lanes: (CalendarEvent | null)[][] = [];
      const eventLayouts: EventLayout[] = [];

      eventsInWeek.forEach(event => {
        const { startDate, endDate } = event;
        const eStart = startOfDay(startDate);
        const eEnd = endOfDay(endDate);
        
        const start = max([eStart, weekStart]);
        const end = min([eEnd, weekEnd]);
        
        const startDay = getDay(start);
        const span = differenceInDays(end, start) + 1;
        
        let lane = 0;
        while (true) {
          if (!lanes[lane]) {
            lanes[lane] = Array(7).fill(null);
          }
          const isLaneOccupied = lanes[lane].slice(startDay, startDay + span).some(e => e !== null);
          if (!isLaneOccupied) {
            break;
          }
          lane++;
        }
        
        for (let i = 0; i < span; i++) {
          if (lanes[lane] && (startDay + i < 7)) {
            lanes[lane][startDay + i] = event;
          }
        }
        eventLayouts.push({ event, startDay, span, lane });
      });

      return { week, events: eventLayouts };
    });
  }, [weeks, events]);


  return (
    <div className="flex-1 flex flex-col border-t border-l rounded-lg overflow-hidden bg-card">
        {/* Header */}
        <div className="grid grid-cols-7 flex-shrink-0">
            {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-semibold border-b border-r bg-muted/30 text-sm">
                {day}
            </div>
            ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 flex-1 relative" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
            {/* Render weeks and days */}
            {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b">
                {week.map((day) => (
                <div
                    key={day.toISOString()}
                    className={cn(
                        "border-r relative min-h-[120px] p-2", 
                        !isSameMonth(day, date) && "bg-muted/20"
                    )}
                >
                    <div className={cn(
                        "font-medium h-7 w-7 flex items-center justify-center text-sm rounded-full",
                        isToday(day) && "bg-primary text-primary-foreground"
                    )}>
                        {format(day, 'd')}
                    </div>
                </div>
                ))}
            </div>
            ))}

            {/* Render event bars on top */}
            <div className="absolute inset-0 grid grid-cols-1 pointer-events-none" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
                {layoutedWeeks.map(({ events: weekEvents }, weekIndex) => (
                    <div key={weekIndex} className="relative h-full pointer-events-auto">
                    {weekEvents.map(({ event, startDay, span, lane }) => {
                        const { id, title, color, type, data, assignedMembers } = event;
                        const assignedNames = assignedMembers.map(m => m.name).join(', ');

                        return (
                            <Tooltip key={id + weekIndex}>
                                <TooltipTrigger asChild>
                                    <div
                                    className={cn(
                                        "absolute h-6 rounded-md flex items-center px-2 cursor-pointer text-xs font-medium z-10 truncate text-white",
                                        color
                                    )}
                                    style={{
                                        top: `${2.5 + (lane * 1.75)}rem`,
                                        left: `calc(${(startDay / 7) * 100}% + 2px)`,
                                        width: `calc(${(span / 7) * 100}% - 4px)`,
                                    }}
                                    >
                                        {title}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{title}</p>
                                    {type === 'project' && <p>Status: {(data as Project).status}</p>}
                                    {type === 'pto' && <p>Type: {(data as PtoRequest).type}</p>}
                                    <p>Dates: {format(event.startDate, 'PP')} to {format(event.endDate, 'PP')}</p>
                                    {assignedNames && <p className="text-sm text-muted-foreground">Team: {assignedNames}</p>}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

const WeekView = ({ date, events }: { date: Date, events: CalendarEvent[] }) => {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekInterval = { start: startOfDay(weekStart), end: endOfDay(weekEnd) };

  const eventsInWeek = events.filter(e => {
    const { startDate, endDate } = e;
    if (!startDate || !endDate) return false;
    const eventStart = startOfDay(startDate);
    const eventEnd = endOfDay(endDate);
    return isWithinInterval(eventStart, weekInterval) || 
        isWithinInterval(eventEnd, weekInterval) ||
        (eventStart < weekStart && eventEnd > weekEnd);
  });

  eventsInWeek.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  
  const lanes: (CalendarEvent | null)[][] = [];
  const allDayEventLayouts: EventLayout[] = [];

  eventsInWeek.forEach(event => {
    const { startDate, endDate } = event;
    const eStart = startOfDay(startDate);
    const eEnd = endOfDay(endDate);
    
    const start = max([eStart, weekStart]);
    const end = min([eEnd, weekEnd]);
    
    const startDay = getDay(start);
    const span = differenceInDays(end, start) + 1;
    
    let lane = 0;
    while (true) {
      if (!lanes[lane]) {
        lanes[lane] = Array(7).fill(null);
      }
      const isLaneOccupied = lanes[lane].slice(startDay, startDay + span).some(e => e !== null);
      if (!isLaneOccupied) {
        break;
      }
      lane++;
    }
    
    for (let i = 0; i < span; i++) {
      if (lanes[lane] && (startDay + i < 7)) {
        lanes[lane][startDay + i] = event;
      }
    }
    allDayEventLayouts.push({ event, startDay, span, lane });
  });

  const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  return (
    <div className="flex-1 flex flex-col border-t border-l rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-[4rem_1fr] flex-shrink-0">
        <div className="p-2 border-b border-r bg-muted/30"></div>
        <div className="grid grid-cols-7">
            {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center border-b border-r bg-muted/30">
                <div className="text-sm text-muted-foreground">{format(day, 'EEE')}</div>
                <div className={cn(
                    "font-semibold text-2xl h-10 w-10 flex items-center justify-center rounded-full mx-auto mt-1",
                    isToday(day) && "bg-primary text-primary-foreground"
                )}>
                    {format(day, 'd')}
                </div>
            </div>
            ))}
        </div>
      </div>
      {/* All-day section */}
      <div className="grid grid-cols-[4rem_1fr] flex-shrink-0 border-b">
        <div className="flex items-center justify-center border-r text-xs text-muted-foreground">All-day</div>
        <div className="relative border-r grid grid-cols-7 h-auto min-h-10">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="border-r h-full"></div>
            ))}
             {allDayEventLayouts.map(({ event, startDay, span, lane }) => {
                 const { id, title, color, type, data, assignedMembers } = event;
                 const assignedNames = assignedMembers.map(m => m.name).join(', ');

                return (
                    <Tooltip key={id + '-week'}>
                        <TooltipTrigger asChild>
                            <div
                            className={cn(
                                "absolute h-6 rounded-md flex items-center px-2 cursor-pointer text-xs font-medium z-10 truncate text-white my-1",
                                color
                            )}
                            style={{
                                top: `${0.25 + (lane * 1.75)}rem`,
                                left: `calc(${(startDay / 7) * 100}% + 2px)`,
                                width: `calc(${(span / 7) * 100}% - 4px)`,
                            }}
                            >
                                {title}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-bold">{title}</p>
                            {type === 'project' && <p>Status: {(data as Project).status}</p>}
                            {type === 'pto' && <p>Type: {(data as PtoRequest).type}</p>}
                            <p>Dates: {format(event.startDate, 'PP')} to {format(event.endDate, 'PP')}</p>
                            {assignedNames && <p className="text-sm text-muted-foreground">Team: {assignedNames}</p>}
                        </TooltipContent>
                    </Tooltip>
             )})}
        </div>
      </div>
      {/* Hourly grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[4rem_1fr] h-full">
            <div className="border-r">
                {hours.map(hour => (
                    <div key={hour} className="h-16 text-right pr-2 text-xs text-muted-foreground border-b relative -top-2">
                        {hour}
                    </div>
                ))}
            </div>
            <div className="relative grid grid-cols-7">
                {days.map((day, dayIndex) => (
                    <div key={day.toISOString()} className={cn("border-r", dayIndex === 6 && "border-r-0")}>
                        {hours.map(hour => (
                            <div key={hour} className="h-16 border-b"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const DayView = ({ date, events }: { date: Date, events: CalendarEvent[] }) => {
  const eventsOnDay = useMemo(() => events.filter(e => {
    return isWithinInterval(date, { start: startOfDay(e.startDate), end: endOfDay(e.endDate) })
  }), [date, events]);

  const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  return (
    <div className="flex-1 flex flex-col border-t border-l rounded-lg overflow-hidden bg-card">
      {/* All-day section */}
      <div className="grid grid-cols-[4rem_1fr] flex-shrink-0 border-b">
        <div className="flex items-center justify-center border-r text-xs text-muted-foreground">All-day</div>
        <div className="relative border-r p-1 space-y-1 min-h-10">
            {eventsOnDay.map((event) => {
                 const { id, title, color, type, data, assignedMembers } = event;
                 const assignedNames = assignedMembers.map(m => m.name).join(', ');
                return (
                    <Tooltip key={id + '-day'}>
                        <TooltipTrigger asChild>
                            <div
                            className={cn(
                                "h-6 rounded-md flex items-center px-2 cursor-pointer text-xs font-medium z-10 truncate text-white",
                                color
                            )}
                            >
                                {title}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="font-bold">{title}</p>
                           {type === 'project' && <p>Status: {(data as Project).status}</p>}
                           {type === 'pto' && <p>Type: {(data as PtoRequest).type}</p>}
                           <p>Dates: {format(event.startDate, 'PP')} to {format(event.endDate, 'PP')}</p>
                           {assignedNames && <p className="text-sm text-muted-foreground">Team: {assignedNames}</p>}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
      </div>
      {/* Hourly grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[4rem_1fr] h-full">
            <div className="border-r">
                {hours.map(hour => (
                    <div key={hour} className="h-16 text-right pr-2 text-xs text-muted-foreground border-b relative -top-2">
                        {hour}
                    </div>
                ))}
            </div>
            <div className="border-r">
                {hours.map(hour => (
                    <div key={hour} className="h-16 border-b"></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const MiniMonth = ({date, events, onDateChange }: {date: Date, events: CalendarEvent[], onDateChange: (date: Date) => void}) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const eventsInMonth = useMemo(() => events.filter(e => {
        const eventStart = startOfDay(e.startDate);
        const eventEnd = endOfDay(e.endDate);
        const monthInterval = { start: startOfDay(monthStart), end: endOfMonth(monthEnd) };
        return isWithinInterval(eventStart, monthInterval) || 
               isWithinInterval(eventEnd, monthInterval) ||
               (eventStart < monthStart && eventEnd > endOfMonth(monthEnd));
    }), [events, monthStart, monthEnd]);

    const getEventsForDay = (day: Date) => {
        return eventsInMonth.filter(e => {
            return isWithinInterval(day, { start: startOfDay(e.startDate), end: endOfDay(e.endDate) });
        });
    }

    return (
        <div>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
                {weekDays.map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 mt-1">
                {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    return (
                        <div key={day.toISOString()} className="flex justify-center items-center py-0.5" style={{height: '2.5rem'}}>
                            <button
                                onClick={() => onDateChange(day)}
                                className={cn(
                                    "h-full w-full flex flex-col items-center justify-start rounded-md text-sm hover:bg-accent pt-1",
                                    !isSameMonth(day, date) && "text-muted-foreground opacity-50",
                                    isToday(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
                                )}
                            >
                                <span>{format(day, 'd')}</span>
                                {dayEvents.length > 0 && isSameMonth(day, date) && (
                                    <div className="flex space-x-1 mt-1">
                                        {dayEvents.slice(0, 3).map((e, i) => (
                                            <div key={`${e.id}-${i}`} className={cn("h-1.5 w-1.5 rounded-full", e.color)}></div>
                                        ))}
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

const YearView = ({ date, events, onDateChange }: { date: Date, events: CalendarEvent[], onDateChange: (date: Date) => void }) => {
    const year = date.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  
    return (
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto border rounded-lg bg-card">
        {months.map(month => (
          <div key={month.getMonth()} className="p-2">
            <h3 className="text-center font-semibold mb-2">{format(month, 'MMMM')}</h3>
            <MiniMonth date={month} events={events} onDateChange={onDateChange}/>
          </div>
        ))}
      </div>
    );
};

export function CalendarView({ view = 'month', date = new Date(), filters, teamMembers = [] }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTraining, setAllTraining] = useState<TrainingSession[]>([]);
  const [allPto, setAllPto] = useState<PtoRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const [projectsData, trainingData, ptoData] = await Promise.all([
            getProjects(),
            getTrainingSessions(),
            getPtoRequests()
        ]);
        setAllProjects(projectsData);
        setAllTraining(trainingData);
        setAllPto(ptoData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const unifiedEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    // Process projects
    if(filters.eventTypes.includes('Projects')) {
      const filteredProjects = allProjects.filter(project => {
          const statusMatch = filters.status.length === 0 || filters.status.includes(project.status);
          const memberMatch = filters.members.length === 0 || project.assignedStaff.some(staffId => filters.members.includes(staffId));
          return statusMatch && memberMatch;
      });
      events.push(...filteredProjects.map(p => {
          const startDate = p.dates.prepTravelIn ?? p.dates.loadIn.from;
          const endDate = p.dates.loadOut.to;
          return {
              id: p.id,
              type: 'project' as const,
              title: p.name,
              startDate,
              endDate,
              color: statusColors[p.status as ProjectStatus],
              data: p,
              assignedMembers: p.assignedStaff.map(id => teamMembers.find(tm => tm.id === id)).filter((tm): tm is TeamMember => !!tm),
          };
      }));
    }
    
    // Process training
    if (filters.eventTypes.includes('Training')) {
        const filteredTraining = allTraining.filter(t => {
             const memberMatch = filters.members.length === 0 || t.attendees.some(id => filters.members.includes(id));
             return memberMatch;
        });
        events.push(...filteredTraining.map(t => ({
            id: t.id,
            type: 'training' as const,
            title: t.courseName,
            startDate: t.dates.from,
            endDate: t.dates.to,
            color: eventTypeColors.training,
            data: t,
            assignedMembers: t.attendees.map(id => teamMembers.find(tm => tm.id === id)).filter((tm): tm is TeamMember => !!tm),
        })));
    }
    
    // Process PTO
    if (filters.eventTypes.includes('PTO')) {
        const filteredPto = allPto.filter(pto => {
            const memberMatch = filters.members.length === 0 || filters.members.includes(pto.teamMemberId);
            return memberMatch;
        });
        events.push(...filteredPto.map(pto => {
            const member = teamMembers.find(tm => tm.id === pto.teamMemberId);
            return {
                id: pto.id,
                type: 'pto' as const,
                title: `${member?.name} - ${pto.type}`,
                startDate: pto.dates.from,
                endDate: pto.dates.to,
                color: eventTypeColors.pto,
                data: pto,
                assignedMembers: member ? [member] : [],
            };
        }));
    }

    return events;
}, [allProjects, allTraining, allPto, filters, teamMembers]);


  const handleNavigation = (params: { view?: CalendarViewMode, date?: Date }) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (params.view) newSearchParams.set('view', params.view);
    if (params.date) newSearchParams.set('date', format(params.date, 'yyyy-MM-dd'));
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  const handlePrev = () => {
    let newDate;
    if (view === 'year') newDate = subYears(date, 1);
    else if (view === 'month') newDate = subMonths(date, 1);
    else if (view === 'week') newDate = subWeeks(date, 1);
    else if (view === 'day') newDate = subDays(date, 1);
    if(newDate) handleNavigation({ date: newDate });
  };

  const handleNext = () => {
    let newDate;
    if (view === 'year') newDate = addYears(date, 1);
    else if (view === 'month') newDate = addMonths(date, 1);
    else if (view === 'week') newDate = addWeeks(date, 1);
    else if (view === 'day') newDate = addDays(date, 1);
    if(newDate) handleNavigation({ date: newDate });
  };
  
  const handleToday = () => handleNavigation({ date: new Date() });
  const handleViewChange = (newView: string) => handleNavigation({ view: newView as CalendarViewMode, date });

  const title = useMemo(() => {
    if (view === 'year') return format(date, 'yyyy');
    if (view === 'month') return format(date, 'MMMM yyyy');
    if (view === 'week') return `Week of ${format(startOfWeek(date), 'MMM d, yyyy')}`;
    if (view === 'day') return format(date, 'MMMM d, yyyy');
    return '';
  }, [date, view]);
  
  return (
      <TooltipProvider>
        <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleToday}>Today</Button>
                    <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold w-52 text-center">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Tabs value={view} onValueChange={handleViewChange} className="hidden md:block">
                        <TabsList>
                            <TabsTrigger value="year">Year</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="day">Day</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {loading ? (
                <Skeleton className="h-full w-full" />
            ) : (
                <div className="flex-1 overflow-auto flex">
                    {view === 'year' && <YearView date={date} events={unifiedEvents} onDateChange={(day) => handleNavigation({ date: day, view: 'day' })}/>}
                    {view === 'month' && <MonthView date={date} events={unifiedEvents} />}
                    {view === 'week' && <WeekView date={date} events={unifiedEvents} />}
                    {view === 'day' && <DayView date={date} events={unifiedEvents} />}
                </div>
            )}
        </div>
    </TooltipProvider>
  );
}

    
