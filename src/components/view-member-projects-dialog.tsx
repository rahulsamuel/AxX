
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Event, Client, Project, TeamMember, ProjectStatus, Priority } from "@/lib/data";
import { format } from "date-fns";
import { Briefcase, Building2, Calendar } from "lucide-react";

interface ViewMemberProjectsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: TeamMember;
  projects: Project[];
  events: Event[];
  clients: Client[];
}

const getStatusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Completed": return "bg-green-100 text-green-800 border-green-200";
    case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Planning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "On Hold": return "bg-gray-200 text-gray-800 border-gray-300";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function ViewMemberProjectsDialog({
  isOpen,
  onOpenChange,
  member,
  projects,
  events,
  clients
}: ViewMemberProjectsDialogProps) {
  const memberProjects = projects.filter((p) => p.assignedStaff.includes(member.id));

  const getEventName = (eventId: string) => events.find(e => e.id === eventId)?.name || 'N/A';
  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Projects for {member.name}</DialogTitle>
          <DialogDescription>
            A summary of all projects assigned to this team member.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6 -mr-6">
            {memberProjects.length > 0 ? (
              <div className="space-y-4 py-2">
                {memberProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="flex-row items-start justify-between gap-4 p-4 bg-muted/30">
                        <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                             <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <Building2 className="h-4 w-4" />
                                <span>{getClientName(project.clientId)}</span>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn(getStatusBadgeClass(project.status))}>
                            {project.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <span>Event: <span className="font-medium text-foreground">{getEventName(project.eventId)}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Show Dates: <span className="font-medium text-foreground">{format(project.dates.show.from, 'MMM d')} - {format(project.dates.show.to, 'MMM d, yyyy')}</span></span>
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">No Projects Assigned</h3>
                  <p className="text-muted-foreground">This team member is not currently assigned to any projects.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
