
"use client";

import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Plus,
  Users,
  MapPin,
  MessageSquare,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  LayoutGrid,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyProgressChart } from "@/components/projects-chart";
import { EventStatusChart } from "@/components/event-status-chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import type { Project, TeamMember, ProjectStatus, Client, Event } from "@/lib/data";
import { getProjects, getTeamMembers, getClients, getEvents, updateUserDashboardWidgets } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";
import { EventOverviewTable } from "@/components/event-overview-table";
import { differenceInDays, format, startOfMonth, subMonths, isWithinInterval, endOfMonth, addMonths } from 'date-fns';
import { AddWidgetDialog } from "@/components/add-widget-dialog";
import { ViewProjectDialog } from "@/components/view-project-dialog";
import type { ProjectWithDetails } from "@/app/(app)/projects/page";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";


export type WidgetId = 'stats' | 'monthlyProgress' | 'eventStatus' | 'upcomingDeadlines' | 'budgetAlerts' | 'eventOverview';

export interface DashboardWidget {
  id: WidgetId;
  name: string;
  description: string;
}

const ALL_WIDGETS: DashboardWidget[] = [
    { id: 'stats', name: 'Statistics Cards', description: 'High-level overview of active events, utilization, etc.' },
    { id: 'monthlyProgress', name: 'Projects: Started vs. Completed', description: 'Bar chart showing projects started vs. completed each month.' },
    { id: 'eventStatus', name: 'Event Status Chart', description: 'Pie chart visualizing the status distribution of all projects.' },
    { id: 'upcomingDeadlines', name: 'Upcoming Deadlines', description: 'A list of critical tasks and project deadlines.' },
    { id: 'budgetAlerts', name: 'Budget Alerts', description: 'A summary of projects nearing or over their budget limits.' },
    { id: 'eventOverview', name: 'Event Overview Table', description: 'A detailed table of recent projects and their key metrics.' },
];

const defaultWidgets: Record<WidgetId, boolean> = {
    stats: true,
    monthlyProgress: true,
    eventStatus: true,
    upcomingDeadlines: true,
    budgetAlerts: true,
    eventOverview: true,
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);
  const [projectToView, setProjectToView] = useState<ProjectWithDetails | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetId, boolean>>(defaultWidgets);

  const handleWidgetsChange = async (newWidgets: Record<WidgetId, boolean>) => {
    if (!user) return;
    setVisibleWidgets(newWidgets); // Optimistic update
    try {
        await updateUserDashboardWidgets(user.uid, newWidgets);
    } catch (error) {
        console.error("Failed to save widgets to database", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save your dashboard layout. Please try again."
        });
        // Revert on error
        const currentUserData = teamMembers.find(tm => tm.id === user.uid);
        setVisibleWidgets(currentUserData?.dashboardWidgets || defaultWidgets);
    }
  };

  useEffect(() => {
    async function fetchData() {
        const [projectsData, teamMembersData, clientsData, eventsData] = await Promise.all([
          getProjects(),
          getTeamMembers(),
          getClients(),
          getEvents()
        ]);
        setProjects(projectsData);
        setTeamMembers(teamMembersData);
        setClients(clientsData);
        setEvents(eventsData);
        
        if (user) {
            const currentUserData = teamMembersData.find(tm => tm.id === user.uid);
            if (currentUserData && currentUserData.dashboardWidgets) {
                 setVisibleWidgets({ ...defaultWidgets, ...currentUserData.dashboardWidgets });
            }
        }
        
        setLoading(false);
    }
    fetchData();
  }, [user]);

  const { statCards, monthlyProgressData, eventStatusData, upcomingDeadlines, budgetAlerts } = useMemo(() => {
    if (loading) {
      return { statCards: [], monthlyProgressData: [], eventStatusData: [], upcomingDeadlines: [], budgetAlerts: [] };
    }

    const projectsWithDetails: ProjectWithDetails[] = projects.map((project) => {
        const client = clients.find((c) => c.id === project.clientId);
        const event = events.find((e) => e.id === project.eventId);
        const assignedStaffDetails = (project.assignedStaff || [])
          .map((staffId) => teamMembers.find((s) => s.id === staffId))
          .filter((s): s is TeamMember => s !== undefined);
        const salesAgent = teamMembers.find(tm => tm.id === project.salesAgentId);

        return {
          ...project,
          eventName: event?.name || "N/A",
          clientName: client?.name || "N/A",
          team: assignedStaffDetails,
          salesAgentName: salesAgent?.name || 'N/A'
        };
    });

    const now = new Date();

    // Stat Cards Data
    const activeEvents = projects.filter(p => p.status === 'In Progress' || p.status === 'Setup').length;
    const upcomingEventsCount = projects.filter(p => {
        try {
            const startDate = p.dates.show.from;
            return startDate > now && differenceInDays(startDate, now) <= 30;
        } catch(e) { return false; }
    }).length;

    const statCardsData = [
      {
        title: "Active Events",
        value: activeEvents.toString(),
        icon: CalendarDays,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        trendText: "currently in setup or progress",
      },
      {
        title: "Upcoming Events",
        value: upcomingEventsCount.toString(),
        icon: AlertTriangle,
        iconBgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        trendText: "in next 30 days",
      },
    ];

    // Event Status Chart Data
    const statusCounts = projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
    }, {} as Record<ProjectStatus, number>);

    const eventStatusChartData = [
        { name: "Planning", value: statusCounts['Planning'] || 0, color: "hsl(var(--chart-5))" },
        { name: "In Progress", value: statusCounts['In Progress'] || 0, color: "hsl(var(--chart-1))" },
        { name: "Setup", value: statusCounts['Setup'] || 0, color: "hsl(var(--chart-3))" },
        { name: "Completed", value: statusCounts['Completed'] || 0, color: "hsl(var(--chart-2))" },
        { name: "On Hold", value: statusCounts['On Hold'] || 0, color: "hsl(var(--chart-4))" },
    ];
    
    // Monthly Progress Chart Data
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const monthlyProgressChartData = Array.from({ length: 6 }).map((_, i) => {
        const monthStart = addMonths(sixMonthsAgo, i);
        const monthEnd = endOfMonth(monthStart);
        const monthName = format(monthStart, 'MMM');

        const completedInMonth = projects.filter(p => 
            p.status === 'Completed' && p.dates.show.to && isWithinInterval(p.dates.show.to, { start: monthStart, end: monthEnd })
        ).length;

        const startedInMonth = projects.filter(p =>
            p.dates.loadIn.from && isWithinInterval(p.dates.loadIn.from, { start: monthStart, end: monthEnd })
        ).length;

        return { month: monthName, completed: completedInMonth, started: startedInMonth };
    });
    
    // Upcoming Deadlines
    const upcomingDeadlinesData = projects
        .filter(p => p.status !== 'Completed' && p.dates.show.to > now && differenceInDays(p.dates.show.to, now) <= 30)
        .map(p => ({
            id: p.id,
            title: `Finalize ${p.services.join(', ')}`,
            project: p.name,
            status: p.priority,
            progress: p.progress,
            date: format(p.dates.show.to, 'yyyy-MM-dd'),
            daysLeft: differenceInDays(p.dates.show.to, now),
            assignee: { initials: p.assignedStaff.length > 0 ? (teamMembers.find(tm => tm.id === p.assignedStaff[0])?.name.split(' ').map(n=>n[0]).join('') || 'U') : 'U', color: 'bg-blue-100 text-blue-800' }
        }))
        .sort((a,b) => a.daysLeft - b.daysLeft)
        .slice(0, 4);

    // Budget Alerts
    const budgetAlertsData = projectsWithDetails.map(p => {
        const utilization = p.budget > 0 ? (p.spentBudget / p.budget) * 100 : 0;
        let message = "Project on track with budget.";
        let Icon = TrendingUp;
        let bgColor = 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800';
        let textColor = 'text-blue-700 dark:text-blue-300';
        let progressColor = 'bg-blue-500';
        let linkClass = 'text-blue-600 dark:text-blue-400 font-semibold';

        if (p.status === 'Completed') {
            if (p.spentBudget <= p.budget) {
                message = "Event completed under budget."; Icon = CheckCircle;
                bgColor = 'bg-green-50/80 border-green-200 dark:bg-green-950/50 dark:border-green-800'; textColor = 'text-green-700 dark:text-green-300'; progressColor = 'bg-green-500'; linkClass = 'text-green-600 dark:text-green-400 font-semibold';
            } else {
                message = "Event completed over budget."; Icon = AlertTriangle;
                bgColor = 'bg-red-50/80 border-red-200 dark:bg-red-950/50 dark:border-red-800'; textColor = 'text-red-700 dark:text-red-300'; progressColor = 'bg-red-500'; linkClass = 'text-red-600 dark:text-red-400 font-semibold';
            }
        } else if (p.status === 'On Hold') {
             message = "Project is currently on hold."; Icon = AlertCircle;
             bgColor = 'bg-gray-100/80 border-gray-200 dark:bg-gray-950/50 dark:border-gray-800'; textColor = 'text-gray-700 dark:text-gray-300'; progressColor = 'bg-gray-500'; linkClass = 'text-gray-600 dark:text-gray-400 font-semibold';
        } else if (utilization > 80 && utilization <= 100) {
            message = `Approaching budget limit. ${utilization.toFixed(0)}% utilized.`; Icon = AlertCircle;
            bgColor = 'bg-yellow-50/80 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800'; textColor = 'text-yellow-700 dark:text-yellow-300'; progressColor = 'bg-yellow-500'; linkClass = 'text-yellow-600 dark:text-yellow-400 font-semibold';
        } else if (utilization > 100) {
            message = `Over budget by ${(utilization - 100).toFixed(0)}%.`; Icon = AlertTriangle;
            bgColor = 'bg-red-50/80 border-red-200 dark:bg-red-950/50 dark:border-red-800'; textColor = 'text-red-700 dark:text-red-300'; progressColor = 'bg-red-500'; linkClass = 'text-red-600 dark:text-red-400 font-semibold';
        }

        return { id: p.id, project: p.name, message, allocated: p.budget, spent: p.spentBudget, Icon, bgColor, textColor, progressColor, linkClass, projectFull: p };
    }).sort((a, b) => (b.spent/b.allocated) - (a.spent/a.allocated)).slice(0, 4);

    return { statCards: statCardsData, monthlyProgressData: monthlyProgressChartData, eventStatusData: eventStatusChartData, upcomingDeadlines: upcomingDeadlinesData, budgetAlerts: budgetAlertsData };
  }, [projects, teamMembers, clients, events, loading]);
  
  const leftWidgetsVisible = visibleWidgets.monthlyProgress;
  const rightWidgetsVisible = visibleWidgets.eventStatus || visibleWidgets.upcomingDeadlines;

  const middleSectionGridClasses = cn("grid gap-6 items-start", {
      "lg:grid-cols-5": leftWidgetsVisible && rightWidgetsVisible,
      "lg:grid-cols-3": leftWidgetsVisible && !rightWidgetsVisible,
      "lg:grid-cols-2": !leftWidgetsVisible && rightWidgetsVisible,
      "lg:grid-cols-1": !leftWidgetsVisible && !rightWidgetsVisible,
  });

  const firstName = user?.displayName?.split(' ')[0] || 'User';


  if (loading) {
      return (
          <div className="flex flex-col gap-6">
              {/* Simplified Skeleton for loading state */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                      <Skeleton className="h-9 w-64" />
                      <Skeleton className="h-5 w-96 mt-2" />
                  </div>
                  <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-36" />
                  </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
              </div>
               <div className="grid gap-6 lg:grid-cols-5 items-start">
                   <div className="lg:col-span-3 flex flex-col gap-6">
                       <Skeleton className="h-80 w-full" />
                   </div>
                   <div className="lg:col-span-2 flex flex-col gap-6">
                       <Skeleton className="h-80 w-full" />
                       <Skeleton className="h-96 w-full" />
                   </div>
               </div>
          </div>
      );
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground">
            Here's your event portfolio at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddWidgetDialogOpen(true)}>
            <LayoutGrid className="mr-2 h-4 w-4" /> Customize
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {visibleWidgets.stats && (
        <div className="grid gap-4 md:grid-cols-2">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-1.5 rounded-md ${card.iconBgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <p>
                    <span className="ml-1">{card.trendText}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts and Lists */}
      {(leftWidgetsVisible || rightWidgetsVisible) && (
        <div className={middleSectionGridClasses}>
            {leftWidgetsVisible && (
              <div className="lg:col-span-3 flex flex-col gap-6">
                {visibleWidgets.monthlyProgress && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Projects: Started vs. Completed</CardTitle>
                      <CardDescription>
                        A summary of new projects started versus projects completed each month for the last 6 months.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <MonthlyProgressChart data={monthlyProgressData} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {rightWidgetsVisible && (
              <div className="lg:col-span-2 flex flex-col gap-6">
                {visibleWidgets.eventStatus && (
                  <Card>
                    <CardHeader>
                        <CardTitle>Event Status</CardTitle>
                    </CardHeader>
                    <EventStatusChart data={eventStatusData} />
                  </Card>
                )}
                {visibleWidgets.upcomingDeadlines && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Upcoming Deadlines</CardTitle>
                        <Button variant="link" asChild><Link href="/calendar">View Calendar</Link></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingDeadlines.map(deadline => (
                            <div key={deadline.id} className="p-4 rounded-lg border space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-sm">{deadline.title}</p>
                                  <Badge variant={deadline.status === 'Critical' ? 'destructive' : 'secondary'}
                                      className={cn(
                                          "font-semibold",
                                          deadline.status === 'Critical' && 'bg-red-100 text-red-800',
                                          deadline.status === 'High' && 'bg-orange-100 text-orange-800',
                                          deadline.status === 'Medium' && 'bg-blue-100 text-blue-800',
                                          deadline.status === 'Low' && 'bg-gray-200 text-gray-800',
                                      )}>
                                      {deadline.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground -mt-2">{deadline.project}</p>

                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-muted-foreground">Progress</span>
                                      <span className="text-xs font-semibold">{deadline.progress}%</span>
                                  </div>
                                  <Progress value={deadline.progress} className="h-2" />
                                </div>

                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>{deadline.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>{deadline.daysLeft} days left</span>
                                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold", deadline.assignee.color)}>
                                          {deadline.assignee.initials}
                                    </div>
                                  </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
        </div>
      )}

      {/* Budget Alerts Section */}
      {visibleWidgets.budgetAlerts && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budget Alerts</CardTitle>
            <Button variant="link" asChild><Link href="#">Manage Budgets</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="flex gap-4 px-6 pt-2 pb-4">
                {budgetAlerts.map((alert) => {
                  const utilization = (alert.spent / alert.allocated) * 100;
                  return (
                    <div key={alert.id} className={cn("flex flex-col justify-between flex-shrink-0 w-[300px] p-5 rounded-xl border", alert.bgColor)}>
                      <div>
                        <div className="flex items-start gap-4 mb-4">
                          <alert.Icon className={cn("h-7 w-7 mt-0.5 flex-shrink-0", alert.textColor)} />
                          <div>
                            <p className="font-semibold text-card-foreground">{alert.project}</p>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="text-xl font-bold text-card-foreground">${alert.allocated.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-xl font-bold text-card-foreground">${alert.spent.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-muted-foreground">Budget Utilization</p>
                          <p className={cn("text-sm font-semibold", alert.textColor)}>
                            {utilization.toFixed(1)}%
                          </p>
                        </div>
                        <Progress 
                          value={utilization} 
                          className={cn("h-2.5", alert.bgColor)}
                          indicatorClassName={alert.progressColor} 
                        />
                        <div className="text-right mt-4">
                          <Button variant="link" className={cn("p-0 h-auto", alert.linkClass)} onClick={() => setProjectToView(alert.projectFull)}>View Details</Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Event Overview Section */}
      {visibleWidgets.eventOverview && (
        <EventOverviewTable projects={projects} teamMembers={teamMembers} />
      )}
    </div>
    {projectToView && (
        <ViewProjectDialog
            project={projectToView}
            isOpen={!!projectToView}
            onOpenChange={(isOpen) => !isOpen && setProjectToView(null)}
        />
    )}
    <AddWidgetDialog
        isOpen={isAddWidgetDialogOpen}
        onOpenChange={setIsAddWidgetDialogOpen}
        allWidgets={ALL_WIDGETS}
        visibleWidgets={visibleWidgets}
        onWidgetsChange={handleWidgetsChange}
    />
    </>
  );
}
