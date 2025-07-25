
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Event, Client, Project, TeamMember, ProjectStatus, Priority } from "@/lib/data";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Briefcase, Building2, CheckSquare } from "lucide-react";

interface ViewEventProjectsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: Event;
  projects: Project[];
  teamMembers: TeamMember[];
  clients: Client[];
}

const getStatusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Planning":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Setup":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "On Hold":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
        case "Critical": return "bg-red-100 text-red-800 border-red-200";
        case "High": return "bg-orange-100 text-orange-800 border-orange-200";
        case "Medium": return "bg-blue-100 text-blue-800 border-blue-200";
        case "Low": return "bg-green-100 text-green-800 border-green-200";
        default: return "bg-gray-200 text-gray-800 border-gray-300";
    }
}

export function ViewEventProjectsDialog({
  isOpen,
  onOpenChange,
  event,
  projects,
  teamMembers,
  clients
}: ViewEventProjectsDialogProps) {
  const eventProjects = projects.filter((p) => p.eventId === event.id);

  const getTeamMemberInfo = (staffId: string) => {
    const member = teamMembers.find((s) => s.id === staffId);
    return {
      initials: member ? member.name.split(" ").map((n) => n[0]).join("") : "?",
      avatarUrl: member?.avatarUrl,
      name: member?.name || "Unknown",
    };
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Projects for {event.name}</DialogTitle>
          <DialogDescription>
            A summary of all projects associated with this event.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-6 -mr-6">
          {eventProjects.length > 0 ? (
            <div className="space-y-4 py-2">
              {eventProjects.map((project) => {
                const profit = project.budget - project.spentBudget;
                const utilization = project.budget > 0 ? (project.spentBudget / project.budget) * 100 : 0;
                const team = project.assignedStaff.map(getTeamMemberInfo);
                const clientName = getClientName(project.clientId);

                return (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="flex-row items-start justify-between gap-4 p-4 bg-muted/30">
                        <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                             <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <Building2 className="h-4 w-4" />
                                <span>{clientName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className={cn(getPriorityBadgeClass(project.priority), "font-semibold")}>
                                {project.priority}
                            </Badge>
                            <Badge variant="outline" className={cn(getStatusBadgeClass(project.status))}>
                                {project.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Financials */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/>Financials</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Budget</span>
                                        <span className="font-medium">${project.budget.toLocaleString()}</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Spent</span>
                                        <span className="font-medium">${project.spentBudget.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <Progress value={utilization} className="h-2 my-1" />
                                        <p className="text-xs text-muted-foreground text-right">{utilization.toFixed(0)}% Utilized</p>
                                    </div>
                                    <Separator />
                                     <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Profit / Loss</span>
                                        <span className={cn("font-bold flex items-center gap-1", profit >= 0 ? "text-green-600" : "text-red-600")}>
                                            {profit >= 0 ? <TrendingUp className="h-4 w-4"/> : <TrendingDown className="h-4 w-4"/>}
                                            ${profit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Dates */}
                            <div className="space-y-4">
                               <h4 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/>Key Dates</h4>
                               <div className="space-y-2 text-sm">
                                   <div className="flex justify-between"><span className="text-muted-foreground">Load In:</span> <span>{format(project.dates.loadIn.from, "MMM d")} - {format(project.dates.loadIn.to, "MMM d, yyyy")}</span></div>
                                   <div className="flex justify-between"><span className="text-muted-foreground">Show:</span> <span className="font-bold">{format(project.dates.show.from, "MMM d")} - {format(project.dates.show.to, "MMM d, yyyy")}</span></div>
                                   <div className="flex justify-between"><span className="text-muted-foreground">Load Out:</span> <span>{format(project.dates.loadOut.from, "MMM d")} - {format(project.dates.loadOut.to, "MMM d, yyyy")}</span></div>
                               </div>
                            </div>
                             {/* Team */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground"/>Assigned Team</h4>
                                <div className="space-y-3">
                                {team.map((member, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face"/>
                                            <AvatarFallback>{member.initials}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{member.name}</span>
                                    </div>
                                ))}
                                {team.length === 0 && <p className="text-sm text-muted-foreground">No staff assigned.</p>}
                                </div>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <CheckSquare className="h-4 w-4 text-muted-foreground"/>
                                Services
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {project.services && project.services.length > 0 ? (
                                    project.services.map(service => (
                                        <Badge key={service} variant="secondary" className="font-normal">{service}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No services listed for this project.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No Projects Found</h3>
                <p className="text-muted-foreground">This event does not have any projects in the system yet.</p>
            </div>
          )}
        </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
