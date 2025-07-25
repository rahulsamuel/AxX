
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Project, TeamMember, Priority, ProjectStatus } from "@/lib/data";
import { format } from 'date-fns';

interface EventOverviewTableProps {
  projects: Project[];
  teamMembers: TeamMember[];
}

const getStatusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Planning":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-transparent";
    case "Setup":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent";
    case "In Progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent";
    case "Completed":
      return "bg-green-100 text-green-800 hover:bg-green-200 border-transparent";
    case "On Hold":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent";
  }
};

const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
        case "Critical":
            return "bg-red-100 text-red-800 hover:bg-red-200 border-transparent font-semibold";
        case "High":
            return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-transparent font-semibold";
        case "Medium":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent font-semibold";
        case "Low":
            return "bg-green-100 text-green-800 hover:bg-green-200 border-transparent font-semibold";
        default:
            return "bg-gray-200 text-gray-800 hover:bg-gray-300 border-transparent font-semibold";
    }
}

export function EventOverviewTable({ projects, teamMembers }: EventOverviewTableProps) {
    
  const getStaffInfo = (staffId: string) => {
    const member = teamMembers.find(s => s.id === staffId);
    if (member) {
        return {
            initials: member.name.split(' ').map(n => n[0]).join(''),
            avatarUrl: member.avatarUrl,
        }
    }
    return { initials: '?', avatarUrl: '' };
  }

  const calculateBudgetVariance = (budget: number, spent: number) => {
    if (budget === 0) return 0;
    const variance = ((spent - budget) / budget) * 100;
    return variance;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Event Overview</CardTitle>
        <Button variant="link" asChild>
          <Link href="/projects" className="flex items-center gap-1">
            View All Events <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-[250px] pl-6">Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget Variance</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead className="pr-6">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.slice(0, 5).map((project) => {
                const budgetVariance = calculateBudgetVariance(project.budget, project.spentBudget);
                const team = project.assignedStaff.map(id => ({ id, ...getStaffInfo(id) }));
                return (
                    <TableRow key={project.id}>
                        <TableCell className="pl-6">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.location}</div>
                        </TableCell>
                        <TableCell>
                            <Badge className={cn(getStatusBadgeClass(project.status))}>{project.status}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Progress value={project.progress} className="h-1.5 w-20"/>
                                <span className="text-sm text-muted-foreground">{project.progress}%</span>
                            </div>
                        </TableCell>
                        <TableCell className={cn(budgetVariance > 0 ? "text-red-600" : "text-green-600", "font-medium")}>
                            {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center -space-x-2">
                                {team.slice(0, 3).map((member) => (
                                    <Avatar key={member.id} className="h-8 w-8 border-2 border-card bg-green-500 text-white">
                                        <AvatarFallback>{member.initials}</AvatarFallback>
                                    </Avatar>
                                ))}
                                {team.length > 3 && (
                                    <Avatar className="h-8 w-8 border-2 border-card bg-muted text-muted-foreground">
                                        <AvatarFallback>+{team.length - 3}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(project.dates.show.to), 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="pr-6">
                             <Badge className={cn(getPriorityBadgeClass(project.priority))}>{project.priority}</Badge>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
