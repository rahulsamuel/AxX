
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Project, TeamMember, ProjectStatus, Priority } from "@/lib/data";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Briefcase, Warehouse, CheckSquare, Percent, Info, Tag } from "lucide-react";

type ProjectWithDetails = Project & {
  eventName: string;
  clientName: string;
  team: TeamMember[];
  salesAgentName: string;
};

interface ViewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: ProjectWithDetails;
}

const getStatusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Planning":
      return "bg-purple-100 text-purple-800 border-transparent";
    case "Setup":
      return "bg-yellow-100 text-yellow-800 border-transparent";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-transparent";
    case "Completed":
      return "bg-green-100 text-green-800 border-transparent";
    case "On Hold":
      return "bg-gray-100 text-gray-800 border-transparent";
    default:
      return "bg-gray-100 text-gray-800 border-transparent";
  }
};

const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
        case "Critical": return "bg-red-100 text-red-800 border-transparent";
        case "High": return "bg-orange-100 text-orange-800 border-transparent";
        case "Medium": return "bg-blue-100 text-blue-800 border-transparent";
        case "Low": return "bg-green-100 text-green-800 border-transparent";
        default: return "bg-gray-200 text-gray-800 border-transparent";
    }
}

export function ViewProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: ViewProjectDialogProps) {
  const profit = project.finalBillingAmount != null ? project.finalBillingAmount - project.spentBudget : project.budget - project.spentBudget;
  const budgetUtilization = project.budget > 0 ? (project.spentBudget / project.budget) * 100 : 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-2xl">{project.name}</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{project.eventName}</span> for <span className="font-semibold">{project.clientName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6 -mr-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status & Priority */}
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className={cn("text-base py-1 px-3", getStatusBadgeClass(project.status))}>{project.status}</Badge>
                            <Badge variant="outline" className={cn("text-base py-1 px-3", getPriorityBadgeClass(project.priority))}>{project.priority} Priority</Badge>
                        </div>

                        {/* Description */}
                        {project.description && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-base flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground"/>Description</h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">{project.description}</p>
                            </div>
                        )}

                         {/* Team */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-base flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground"/>Assigned Team</h4>
                            <div className="flex flex-wrap gap-4">
                            {project.team.map((member) => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
                                        <AvatarFallback>{member.name.split(" ").map(n=>n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                            {project.team.length === 0 && <p className="text-sm text-muted-foreground">No staff assigned.</p>}
                            </div>
                        </div>

                         {/* Services */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-base flex items-center gap-2"><CheckSquare className="h-4 w-4 text-muted-foreground"/>Services</h4>
                            <div className="flex flex-wrap gap-2">
                                {project.services.map(service => (
                                    <Badge key={service} variant="secondary">{service}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Financials */}
                        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4"/>Financials</h4>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Budget</span>
                                <span className="font-medium">${project.budget.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Spent</span>
                                <span className="font-medium">${project.spentBudget.toLocaleString()}</span>
                            </div>
                            <div>
                                <Progress value={budgetUtilization} className="h-2 my-1" />
                                <p className="text-xs text-muted-foreground text-right">{budgetUtilization.toFixed(0)}% Utilized</p>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Final Billing</span>
                                <span className="font-medium">{project.finalBillingAmount != null ? `$${project.finalBillingAmount.toLocaleString()}` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Final Margin</span>
                                <span className={cn("font-bold flex items-center gap-1", project.finalMargin != null && project.finalMargin < 0 ? 'text-red-500' : 'text-green-600')}>
                                    {project.finalMargin != null ? `${project.finalMargin.toFixed(1)}%` : 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Key Info */}
                         <div className="p-4 rounded-lg border space-y-3">
                             <div className="flex items-center gap-2 text-sm">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground mr-2">RW #</span>
                                <span className="font-medium">{project.projectNumber}</span>
                            </div>
                             <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground mr-2">Sales Agent</span>
                                <span className="font-medium">{project.salesAgentName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Warehouse className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground mr-2">Warehouse</span>
                                <span className="font-medium">{project.warehouse}</span>
                            </div>
                             <div className="flex items-center gap-2 text-sm">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground mr-2">Probability</span>
                                <span className="font-medium">{project.probability}%</span>
                            </div>
                        </div>

                         {/* Dates */}
                        <div className="p-4 rounded-lg border space-y-3">
                             <h4 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4"/>Key Dates</h4>
                             <div className="space-y-2 text-sm pl-6 border-l-2 ml-2 border-primary/50">
                                <div className="relative">
                                    <div className="absolute -left-[29.5px] top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
                                    <p className="font-semibold">Load In</p>
                                    <p className="text-muted-foreground">{format(project.dates.loadIn.from, "MMM d")} - {format(project.dates.loadIn.to, "MMM d, yyyy")}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[29.5px] top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
                                    <p className="font-semibold">Show</p>
                                    <p className="text-muted-foreground">{format(project.dates.show.from, "MMM d")} - {format(project.dates.show.to, "MMM d, yyyy")}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[29.5px] top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
                                    <p className="font-semibold">Load Out</p>
                                    <p className="text-muted-foreground">{format(project.dates.loadOut.from, "MMM d")} - {format(project.dates.loadOut.to, "MMM d, yyyy")}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
