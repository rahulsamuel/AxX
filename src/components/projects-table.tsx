
"use client";

import * as React from "react";
import { format } from "date-fns";
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
import { Project, ProjectStatus, TeamMember } from "@/lib/data";
import { Card } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Archive,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Download,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";

type ProjectWithDetails = Project & {
  eventName: string;
  clientName: string;
  team: TeamMember[];
  salesAgentName: string;
};

interface ProjectsTableProps {
  projects: ProjectWithDetails[];
  selectedProjectIds: string[];
  onSelectionChange: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onView: (project: ProjectWithDetails) => void;
  onEdit: (project: ProjectWithDetails) => void;
  onDelete: (project: ProjectWithDetails) => void;
  onBulkAction: (action: 'archive' | 'export' | 'assignTeam' | 'changeStatus' | 'delete') => void;
}

const getStatusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case "Planning":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "Setup":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "Completed":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "On Hold":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

export function ProjectsTable({
  projects,
  selectedProjectIds,
  onSelectionChange,
  onSelectAll,
  onClearSelection,
  onView,
  onEdit,
  onDelete,
  onBulkAction,
}: ProjectsTableProps) {
  const isAllSelected =
    projects.length > 0 && selectedProjectIds.length === projects.length;
  const isSomeSelected =
    selectedProjectIds.length > 0 &&
    selectedProjectIds.length < projects.length;

  const groupedProjects = React.useMemo(() => {
    const groups: { [year: string]: { [month: string]: ProjectWithDetails[] } } = {};
    projects.forEach(project => {
        const date = new Date(project.dates.show.from);
        const year = date.getFullYear().toString();
        const month = date.getMonth().toString(); // 0-11 for Jan-Dec, as string
        if (!groups[year]) {
            groups[year] = {};
        }
        if (!groups[year][month]) {
            groups[year][month] = [];
        }
        groups[year][month].push(project);
    });
    return groups;
  }, [projects]);

  return (
    <TooltipProvider>
    <Card className="bg-card">
      <div className="p-4 border-b">
        {selectedProjectIds.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">
                  {selectedProjectIds.length} project
                  {selectedProjectIds.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <Button
                variant="link"
                onClick={onClearSelection}
                className="text-primary p-0 h-auto text-sm"
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onBulkAction('export')}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => onBulkAction('archive')}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    More actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onBulkAction('archive')}>
                    <Archive className="mr-2 h-4 w-4" /> Archive Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('export')}>
                    <Download className="mr-2 h-4 w-4" /> Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('assignTeam')}>
                    <UserPlus className="mr-2 h-4 w-4" /> Assign Team
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('changeStatus')}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Change Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onBulkAction('delete')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Showing {projects.length} of {projects.length} projects
          </p>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] sticky top-0 left-0 bg-card z-30">
              <Checkbox
                checked={isSomeSelected ? "indeterminate" : isAllSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead className="sticky top-0 left-10 bg-card z-30 min-w-[250px]">Project</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">RW #</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">Status</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">Sales Agent</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">Warehouse</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">Services</TableHead>
            <TableHead className="sticky top-0 bg-card z-20">Probability</TableHead>
            <TableHead className="sticky top-0 text-right bg-card z-20">Budget</TableHead>
            <TableHead className="text-center sticky top-0 right-0 bg-card z-30">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(groupedProjects)
            .sort((a, b) => Number(b) - Number(a))
            .map(year => (
            <React.Fragment key={year}>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={10} className="py-2.5 px-4">
                  <h2 className="text-lg font-bold text-foreground">{year}</h2>
                </TableCell>
              </TableRow>
              {Object.keys(groupedProjects[year])
                .sort((a, b) => Number(b) - Number(a))
                .map(month => (
                <React.Fragment key={`${year}-${month}`}>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={10} className="py-2 px-6">
                      <h3 className="text-base font-semibold text-foreground/90">{format(new Date(Number(year), Number(month)), 'MMMM')}</h3>
                    </TableCell>
                  </TableRow>
                  {groupedProjects[year][month].map(project => (
                    <TableRow
                      key={project.id}
                      data-state={
                        selectedProjectIds.includes(project.id) ? "selected" : "unselected"
                      }
                    >
                      <TableCell className="sticky left-0 bg-card z-10">
                        <Checkbox
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={() => onSelectionChange(project.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium sticky left-10 bg-card z-10">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.eventName} &middot; {project.clientName}
                        </div>
                      </TableCell>
                      <TableCell>{project.projectNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0",
                            getStatusBadgeClass(project.status)
                          )}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.salesAgentName}</TableCell>
                      <TableCell>{project.warehouse}</TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(project.services || []).map(service => (
                                  <Badge key={service} variant="secondary" className="font-normal">{service}</Badge>
                              ))}
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                              <Progress value={project.probability} className="h-1.5 w-16" />
                              <span className="text-sm text-muted-foreground">{project.probability}%</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          ${project.budget.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${(project.spentBudget || 0).toLocaleString()} spent
                        </div>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 bg-card z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => onView(project)}>
                              <Briefcase className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(project)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onDelete(project)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Card>
    </TooltipProvider>
  );
}
