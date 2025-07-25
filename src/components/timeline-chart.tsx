
"use client";

import { useMemo, useRef, useEffect, useState } from 'react';
import type { Project, ProjectStatus, TeamMember, TrainingSession, PtoRequest } from '@/lib/data';
import { startOfYear, endOfYear, eachDayOfInterval, differenceInDays, format, isSameDay, max, min, isFirstDayOfMonth, isSaturday, isSunday, isWithinInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from './ui/progress';
import { ProjectWithDetails, TimelineEventType } from '@/app/(app)/timeline/page';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronRight } from 'lucide-react';

const statusColors: Record<ProjectStatus, { bar: string; progress: string }> = {
    "Planning":    { bar: "bg-purple-500/80 border border-purple-400", progress: "bg-purple-300" },
    "Setup":       { bar: "bg-yellow-500/80 border border-yellow-400", progress: "bg-yellow-300" },
    "In Progress": { bar: "bg-blue-500/80 border border-blue-400",    progress: "bg-blue-300" },
    "Completed":   { bar: "bg-green-500/80 border border-green-400",  progress: "bg-green-300" },
    "On Hold":     { bar: "bg-gray-500/80 border border-gray-400",    progress: "bg-gray-300" },
};

const timelineEventTypeColors = {
    Training: "bg-orange-500/80 border border-orange-400",
    PTO: "bg-teal-500/80 border border-teal-400",
}

interface TimelineChartProps {
    projects: ProjectWithDetails[];
    trainingSessions: TrainingSession[];
    ptoRequests: PtoRequest[];
    viewDate: Date;
    viewMode: 'projects' | 'teams';
    allTeamMembers: TeamMember[];
    visibleEventTypes: TimelineEventType[];
}

type UnifiedTimelineEvent = {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    type: TimelineEventType;
    data: Project | TrainingSession | PtoRequest;
};


export function TimelineChart({ projects, trainingSessions, ptoRequests, viewDate, viewMode, allTeamMembers, visibleEventTypes }: TimelineChartProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [openTeamCollapsibles, setOpenTeamCollapsibles] = useState<Record<string, boolean>>({});
    const [openProjectCollapsibles, setOpenProjectCollapsibles] = useState<Record<string, boolean>>({});


    const { startDate, endDate, days } = useMemo(() => {
        const start = startOfYear(viewDate);
        const end = endOfYear(viewDate);
        const dayArray = eachDayOfInterval({ start, end });
        return { startDate: start, endDate: end, days: dayArray };
    }, [viewDate]);
    
    const months = useMemo(() => {
        return eachMonthOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const dayWidth = 48;
    const projectsColWidth = 300;
    const rowHeight = 64;
    const monthHeaderHeight = 30;
    const dayHeaderHeight = 40;
    const totalHeaderHeight = monthHeaderHeight + dayHeaderHeight;


    const groupedProjects = useMemo(() => {
        if (viewMode !== 'projects') return {};
        const initialGroups: Record<string, ProjectWithDetails[]> = {};
        const projectsInView = projects.filter(p => {
            const projStart = p.dates.prepTravelIn ?? p.dates.loadIn.from ?? p.dates.show.from;
            const projEnd = p.dates.loadOut.to;
            return projStart <= endDate && projEnd >= startDate;
        });

        return projectsInView.reduce((acc, project) => {
            const status = project.status;
            if (!acc[status]) acc[status] = [];
            acc[status].push(project);
            return acc;
        }, initialGroups);
    }, [projects, startDate, endDate, viewMode]);

    const memberEvents = useMemo(() => {
        if (viewMode !== 'teams') return new Map<string, UnifiedTimelineEvent[]>();
        const map = new Map<string, UnifiedTimelineEvent[]>();
        allTeamMembers.forEach(member => map.set(member.id, []));

        if (visibleEventTypes.includes('Projects')) {
            projects.forEach(project => {
                project.assignedStaff.forEach(memberId => {
                    if (map.has(memberId)) {
                         map.get(memberId)!.push({
                            id: project.id,
                            title: project.name,
                            startDate: project.dates.prepTravelIn ?? project.dates.loadIn.from,
                            endDate: project.dates.loadOut.to,
                            type: 'Projects',
                            data: project,
                        });
                    }
                });
            });
        }

        if (visibleEventTypes.includes('Training')) {
            trainingSessions.forEach(session => {
                session.attendees.forEach(memberId => {
                    if (map.has(memberId)) {
                         map.get(memberId)!.push({
                            id: session.id,
                            title: session.courseName,
                            startDate: session.dates.from,
                            endDate: session.dates.to,
                            type: 'Training',
                            data: session,
                        });
                    }
                });
            });
        }

        if (visibleEventTypes.includes('PTO')) {
            ptoRequests.forEach(request => {
                if (map.has(request.teamMemberId)) {
                    map.get(request.teamMemberId)!.push({
                        id: request.id,
                        title: request.type,
                        startDate: request.dates.from,
                        endDate: request.dates.to,
                        type: 'PTO',
                        data: request,
                    });
                }
            });
        }

        return map;
    }, [allTeamMembers, projects, trainingSessions, ptoRequests, visibleEventTypes, viewMode]);
    
    const groupedTeamMembers = useMemo(() => {
        if (viewMode !== 'teams') return {};
        const initialGroups: Record<string, TeamMember[]> = {};
        
        return allTeamMembers.reduce((acc, member) => {
            const department = member.department || 'Other';
            if (!acc[department]) acc[department] = [];
            acc[department].push(member);
            return acc;
        }, initialGroups);
    }, [allTeamMembers, viewMode]);
    
    useEffect(() => {
        const defaultOpenState = Object.keys(groupedTeamMembers).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setOpenTeamCollapsibles(defaultOpenState);
    }, [groupedTeamMembers]);

     useEffect(() => {
        const defaultOpenState = Object.keys(groupedProjects).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setOpenProjectCollapsibles(defaultOpenState);
    }, [groupedProjects]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isWithinInterval(new Date(), {start: startDate, end: endDate})) return;

        const todayIndex = differenceInDays(new Date(), startDate);
        const scrollPosition = (todayIndex * dayWidth) - (container.offsetWidth / 2) + (dayWidth / 2);

        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth',
        });
    }, [viewDate, startDate, endDate]);

    const getBarPosition = (eventStartDate: Date, eventEndDate: Date) => {
        const visibleStart = max([eventStartDate, startDate]);
        const visibleEnd = min([eventEndDate, endDate]);
        const startOffsetDays = differenceInDays(visibleStart, startDate);
        const durationDays = differenceInDays(visibleEnd, visibleStart) + 1;

        if (durationDays <= 0 || startOffsetDays < 0) return { display: 'none' };

        const left = startOffsetDays * dayWidth;
        const width = durationDays * dayWidth;

        return { left: `${left}px`, width: `${width}px` };
    };

    const renderProjectView = () => (
        <>
            {Object.entries(groupedProjects).map(([status, projectsInGroup]) => (
                projectsInGroup.length > 0 && (
                     <Collapsible key={status} open={openProjectCollapsibles[status]} onOpenChange={(isOpen) => setOpenProjectCollapsibles(prev => ({ ...prev, [status]: isOpen }))}>
                         <div className="flex">
                             <div className="sticky left-0 z-20 flex-shrink-0 bg-card border-r" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}>
                                 <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center p-2 font-semibold border-b bg-muted sticky z-20" style={{ top: `${totalHeaderHeight}px`, height: '41px' }}>
                                        <ChevronRight className={cn("h-4 w-4 mr-2 transition-transform", openProjectCollapsibles[status] && "rotate-90")} />
                                        {status} <span className="ml-2 text-muted-foreground font-normal">({projectsInGroup.length})</span>
                                    </div>
                                 </CollapsibleTrigger>
                             </div>
                             <div className="flex-1">
                                 <div className="p-2 font-semibold border-b invisible" style={{ height: "41px" }}>{status}</div>
                             </div>
                         </div>
                        <CollapsibleContent>
                        <div className="flex">
                            <div className="sticky left-0 z-20 flex-shrink-0 bg-card border-r" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}>
                                {projectsInGroup.map((project) => (
                                    <div key={project.id} className="flex border-b items-center p-3 truncate bg-card" style={{ height: `${rowHeight}px` }}>
                                        <div className="truncate ml-2">
                                            <p className="font-semibold truncate">{project.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{project.clientName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute inset-0 flex">
                                    {days.map((day, i) => (
                                        <div key={i} className={cn("border-r h-full", (isSaturday(day) || isSunday(day)) && "bg-muted/40")} style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}></div>
                                    ))}
                                </div>
                                {projectsInGroup.map((project) => {
                                    const projStart = project.dates.prepTravelIn ?? project.dates.loadIn.from ?? project.dates.show.from;
                                    const projEnd = project.dates.loadOut.to;
                                    return (
                                        <div key={project.id} className="relative" style={{ height: `${rowHeight}px` }}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div className={cn("absolute my-2 h-12 rounded-lg text-white flex items-center px-3 cursor-pointer z-10 overflow-hidden", statusColors[project.status as ProjectStatus].bar)} style={getBarPosition(projStart, projEnd)}>
                                                        <Progress value={project.progress} className="absolute inset-0 h-full w-full bg-transparent rounded-lg" indicatorClassName={statusColors[project.status as ProjectStatus].progress} />
                                                        <div className="relative z-10 flex items-center gap-2 truncate">
                                                            <div className="flex -space-x-2">
                                                                {project.team.slice(0, 2).map((staff) => (
                                                                    <Avatar key={staff.id} className="h-6 w-6 border-2 border-white/50">
                                                                        <AvatarImage src={staff.avatarUrl} data-ai-hint="person face" />
                                                                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                            </div>
                                                            <span className="font-medium truncate">{project.name}</span>
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="font-bold text-base mb-2">{project.name}</div>
                                                    <div className="space-y-1.5 text-sm">
                                                        <p><span className="font-semibold">Client:</span> {project.clientName}</p>
                                                        <p><span className="font-semibold">Status:</span> {project.status}</p>
                                                        <p><span className="font-semibold">Timeline:</span> {format(projStart, 'MMM d')} - {format(projEnd, 'MMM d, yyyy')}</p>
                                                        <p><span className="font-semibold">Progress:</span> {project.progress}%</p>
                                                        <p><span className="font-semibold">Team:</span> {project.team.map(s => s.name).join(', ') || 'N/A'}</p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        </CollapsibleContent>
                    </Collapsible>
                )
            ))}
        </>
    );

    const renderTeamView = () => (
        <>
            {Object.entries(groupedTeamMembers).map(([department, members]) => (
                <Collapsible key={department} open={openTeamCollapsibles[department]} onOpenChange={(isOpen) => setOpenTeamCollapsibles(prev => ({ ...prev, [department]: isOpen }))}>
                    <div className="flex">
                        <div className="sticky left-0 z-20 flex-shrink-0 bg-card border-r" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}>
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center p-2 font-semibold border-b bg-muted sticky z-20" style={{ top: `${totalHeaderHeight}px`, height: '41px' }}>
                                    <ChevronRight className={cn("h-4 w-4 mr-2 transition-transform", openTeamCollapsibles[department] && "rotate-90")} />
                                    {department} <span className="ml-2 text-muted-foreground font-normal">({members.length})</span>
                                </div>
                            </CollapsibleTrigger>
                        </div>
                        <div className="flex-1">
                            <div className="p-2 font-semibold border-b invisible" style={{ height: "41px" }}>{department}</div>
                        </div>
                    </div>
                    
                    <CollapsibleContent>
                        <div className="flex">
                             <div className="sticky left-0 z-20 flex-shrink-0 bg-card border-r" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}>
                                {members.map(member => (
                                    <div key={member.id} className="flex border-b items-center p-3 truncate bg-card" style={{ height: `${rowHeight}px` }}>
                                        <Avatar className="h-9 w-9 mr-3 flex-shrink-0">
                                            <AvatarImage src={member.avatarUrl} data-ai-hint="person face" />
                                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <p className="font-semibold truncate">{member.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute inset-0 flex">
                                    {days.map((day, i) => (
                                        <div key={i} className={cn("border-r h-full", (isSaturday(day) || isSunday(day)) && "bg-muted/40")} style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}></div>
                                    ))}
                                </div>
                                {members.map(member => {
                                    const events = memberEvents.get(member.id) || [];
                                    return (
                                        <div key={member.id} className="relative border-b" style={{ height: `${rowHeight}px` }}>
                                            {events.map((event, index) => {
                                                const { id, title, startDate, endDate, type, data } = event;
                                                
                                                const barColor = type === 'Projects' 
                                                    ? statusColors[(data as Project).status].bar 
                                                    : timelineEventTypeColors[type as 'Training' | 'PTO'];

                                                const progress = type === 'Projects' ? (data as Project).progress : undefined;
                                                const progressColor = type === 'Projects' ? statusColors[(data as Project).status].progress : undefined;

                                                return (
                                                    <Tooltip key={`${id}-${index}`} delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={cn("absolute my-2 h-12 rounded-lg text-white flex items-center px-3 cursor-pointer z-10 overflow-hidden", barColor)}
                                                                style={getBarPosition(startDate, endDate)}
                                                            >
                                                                {progress !== undefined && progressColor && (
                                                                    <Progress value={progress} className="absolute inset-0 h-full w-full bg-transparent rounded-lg" indicatorClassName={progressColor} />
                                                                )}
                                                                <span className="relative z-10 font-medium truncate">{title}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="font-bold text-base mb-2">{title}</div>
                                                            <div className="space-y-1.5 text-sm">
                                                                {type === 'Projects' && <p><span className="font-semibold">Client:</span> {(data as ProjectWithDetails).clientName}</p>}
                                                                <p><span className="font-semibold">Type:</span> {type}</p>
                                                                <p><span className="font-semibold">Timeline:</span> {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </>
    );


    return (
        <TooltipProvider>
            <div ref={scrollContainerRef} className="flex-1 overflow-auto border rounded-lg bg-card">
                <div className="relative" style={{ minWidth: `${projectsColWidth + (days.length * dayWidth)}px` }}>
                    {/* Header */}
                    <div className="sticky top-0 z-30 bg-card">
                        {/* Month Header */}
                        <div className="flex" style={{ height: `${monthHeaderHeight}px` }}>
                            <div className="sticky left-0 z-40 border-b border-r bg-card" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}></div>
                            <div className="flex-1 flex border-b">
                                {months.map((month) => {
                                    const monthStartInView = max([startOfMonth(month), startDate]);
                                    const monthEndInView = min([endOfMonth(month), endDate]);
                                    const monthDurationDays = differenceInDays(monthEndInView, monthStartInView) + 1;
                                    const width = monthDurationDays * dayWidth;

                                    return (
                                        <div key={month.toString()} className="flex items-center justify-start p-2 border-r" style={{ width: `${width}px` }}>
                                            <span className="font-semibold text-sm">{format(month, 'MMMM')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Day Header */}
                        <div className="flex" style={{ height: `${dayHeaderHeight}px` }}>
                            <div className="sticky left-0 z-40 p-3 font-semibold border-b border-r bg-card flex items-center" style={{ width: `${projectsColWidth}px`, minWidth: `${projectsColWidth}px` }}>
                                {viewMode === 'projects' ? 'Projects' : 'Team Members'}
                            </div>
                            <div className="flex-1 flex border-b">
                                {days.map((day, i) => (
                                    <div key={i} className="flex-shrink-0 text-center py-1 border-r flex flex-col justify-center" style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}>
                                        <div className="text-xs text-muted-foreground">{format(day, 'E')}</div>
                                        <div className={cn("font-semibold text-lg", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Today Marker */}
                    {isWithinInterval(new Date(), { start: startDate, end: endDate }) && (
                        <div className="absolute top-0 bottom-0 w-[2px] bg-primary/80 z-20" style={{ left: `${projectsColWidth + (differenceInDays(new Date(), startDate) * dayWidth) + (dayWidth/2) - 1}px` }}>
                            <div className="sticky left-0 pt-1" style={{top: `${totalHeaderHeight}px`}}>
                                <div className="absolute left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                    Today
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {viewMode === 'projects' ? renderProjectView() : renderTeamView()}
                </div>
            </div>
        </TooltipProvider>
    );
}
