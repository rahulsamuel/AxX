
"use client";

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Project, TeamMember, ProjectStatus, Client, Event, TrainingSession, PtoRequest } from '@/lib/data';
import { getProjects, getTeamMembers, getClients, getEvents, getTrainingSessions, getPtoRequests } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Download, Search } from 'lucide-react';
import { addYears, subYears, format, startOfYear } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { TimelineChart } from '@/components/timeline-chart';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

const statusOptions: { label: ProjectStatus; color: string }[] = [
  { label: "Planning", color: "bg-purple-500" },
  { label: "Setup", color: "bg-yellow-500" },
  { label: "In Progress", color: "bg-blue-500" },
  { label: "Completed", color: "bg-green-500" },
  { label: "On Hold", color: "bg-gray-500" },
];

export type TimelineEventType = 'Projects' | 'Training' | 'PTO';

const timelineEventTypeOptions: { label: TimelineEventType; color: string }[] = [
    { label: "Projects", color: "bg-blue-500" },
    { label: "Training", color: "bg-orange-500" },
    { label: "PTO", color: "bg-teal-500" },
];

export type ProjectWithDetails = Project & {
    team: TeamMember[];
    clientName: string;
};

export default function TimelinePage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [ptoRequests, setPtoRequests] = useState<PtoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
    const [viewMode, setViewMode] = useState<'projects' | 'teams'>('projects');
    const [visibleEventTypes, setVisibleEventTypes] = useState<TimelineEventType[]>(['Projects', 'Training', 'PTO']);


    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const viewDate = useMemo(() => {
        const yearParam = searchParams.get('year');
        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        
        if (isNaN(year) || year < 1000 || year > 9999) {
            return startOfYear(new Date());
        }
        return startOfYear(new Date(year, 0, 1));
    }, [searchParams]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [p, t, c, e, ts, pto] = await Promise.all([
                getProjects(), 
                getTeamMembers(), 
                getClients(), 
                getEvents(),
                getTrainingSessions(),
                getPtoRequests()
            ]);
            setProjects(p);
            setTeamMembers(t);
            setClients(c);
            setTrainingSessions(ts);
            setPtoRequests(pto);
            setLoading(false);
        }
        fetchData();
    }, []);

    const projectsWithDetails: ProjectWithDetails[] = useMemo(() => {
        return projects.map(p => {
            const team = p.assignedStaff.map(id => teamMembers.find(tm => tm.id === id)).filter((tm): tm is TeamMember => !!tm);
            const client = clients.find(c => c.id === p.clientId);
            return {...p, team, clientName: client?.name || 'N/A'};
        });
    }, [projects, teamMembers, clients]);

    const filteredProjects = useMemo(() => {
        return projectsWithDetails.filter(p => {
            const searchMatch = viewMode === 'teams' || 
                (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
            const statusMatch = viewMode === 'teams' || selectedStatuses.length === 0 || selectedStatuses.includes(p.status);
            return searchMatch && statusMatch;
        });
    }, [projectsWithDetails, searchTerm, selectedStatuses, viewMode]);

    const filteredTeamMembers = useMemo(() => {
        if (viewMode !== 'teams') return teamMembers;
        return teamMembers.filter(member => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teamMembers, searchTerm, viewMode]);
    
    const handleNavigation = (newDate: Date) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('year', format(newDate, 'yyyy'));
        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    const handlePrev = () => handleNavigation(subYears(viewDate, 1));
    const handleNext = () => handleNavigation(addYears(viewDate, 1));
    const handleThisYear = () => handleNavigation(new Date());

    const title = useMemo(() => format(viewDate, 'yyyy'), [viewDate]);
    
    const handleEventTypeToggle = (eventType: TimelineEventType) => {
        setVisibleEventTypes(prev => 
            prev.includes(eventType)
                ? prev.filter(t => t !== eventType)
                : [...prev, eventType]
        );
    };


    const handleExport = () => {
        if (filteredProjects.length === 0) {
            alert("No projects to export.");
            return;
        }

        const headers = ["Project Name", "Client", "Status", "Start Date", "End Date", "Assigned Staff"];
        const csvContent = [
            headers.join(','),
            ...filteredProjects.map(p => {
                const staffNames = p.team.map(tm => tm.name).join('; ');
                const projStart = p.dates.prepTravelIn ?? p.dates.loadIn.from ?? p.dates.show.from;
                const projEnd = p.dates.loadOut.to;

                return [
                    `"${p.name.replace(/"/g, '""')}"`,
                    `"${p.clientName.replace(/"/g, '""')}"`,
                    p.status,
                    projStart.toLocaleDateString(),
                    projEnd.toLocaleDateString(),
                    `"${staffNames}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `timeline_export_${format(new Date(), 'yyyy-MM')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
             <div className="flex flex-col h-full gap-6">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
                  <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-80 mt-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </header>
                <main className="flex-1 -mt-6 pt-6 overflow-hidden">
                   <Skeleton className="h-full w-full" />
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <header className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b">
                <div>
                    <h1 className="text-3xl font-bold">{viewMode === 'projects' ? 'Project Timeline' : 'Team Timeline'}</h1>
                    <p className="text-muted-foreground">
                         {viewMode === 'projects' 
                            ? 'Visualize project schedules and milestones.' 
                            : 'Visualize team member assignments and availability.'
                        }
                    </p>
                </div>
                 <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                        <TabsList>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="teams">Teams</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex items-center">
                        <Button variant="outline" size="sm" onClick={handleThisYear}>This Year</Button>
                        <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft className="h-5 w-5" /></Button>
                        <h2 className="text-xl font-semibold w-24 text-center">{title}</h2>
                        <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight className="h-5 w-5" /></Button>
                    </div>
                </div>
            </header>

             <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-auto md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={viewMode === 'projects' ? "Search projects by name or client..." : "Search team members..."}
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Filter
                                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {viewMode === 'projects' ? selectedStatuses.length : visibleEventTypes.length}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                            {viewMode === 'projects' ? (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm p-2">Project Status</h4>
                                    <div className="space-y-1">
                                        {statusOptions.map(option => (
                                            <div key={option.label} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                                                <Checkbox
                                                    id={`timeline-status-${option.label}`}
                                                    checked={selectedStatuses.includes(option.label)}
                                                    onCheckedChange={checked => {
                                                        if(checked) {
                                                            setSelectedStatuses([...selectedStatuses, option.label])
                                                        } else {
                                                            setSelectedStatuses(selectedStatuses.filter(s => s !== option.label))
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`timeline-status-${option.label}`} className="flex items-center gap-2 flex-1 cursor-pointer text-sm font-medium">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", option.color)}></span>
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm p-2">Visible Event Types</h4>
                                    <div className="space-y-1">
                                        {timelineEventTypeOptions.map(option => (
                                            <div key={option.label} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                                                <Checkbox
                                                    id={`timeline-event-${option.label}`}
                                                    checked={visibleEventTypes.includes(option.label)}
                                                    onCheckedChange={() => handleEventTypeToggle(option.label)}
                                                />
                                                <Label htmlFor={`timeline-event-${option.label}`} className="flex items-center gap-2 flex-1 cursor-pointer text-sm font-medium">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", option.color)}></span>
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
                </div>
            </div>

            <main className="flex-1 flex flex-col overflow-hidden">
                <TimelineChart 
                  projects={filteredProjects} 
                  trainingSessions={trainingSessions}
                  ptoRequests={ptoRequests}
                  viewDate={viewDate}
                  viewMode={viewMode}
                  allTeamMembers={filteredTeamMembers}
                  visibleEventTypes={visibleEventTypes}
                />
            </main>
        </div>
    );
}
