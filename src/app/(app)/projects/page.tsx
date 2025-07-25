
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Project, Client, TeamMember, Priority, ProjectStatus, Event } from "@/lib/data";
import { getProjects, getClients, getTeamMembers, deleteProject, updateProject, getEvents } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectFilters, type ProjectFilterState } from "@/components/project-filters";
import { ProjectsTable } from "@/components/projects-table";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { ViewProjectDialog } from "@/components/view-project-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProjectBulkActionsDialog } from "@/components/project-bulk-actions-dialog";


const initialFilterState: ProjectFilterState = {
  search: "",
  status: "all",
  timeline: { from: undefined, to: undefined },
  budget: { min: 0, max: 1000000 },
  client: "all",
  priorities: [],
  team: [],
  event: "all",
  dateFilter: { year: 'all', month: 'all' },
};

export type ProjectWithDetails = Project & {
  eventName: string;
  clientName: string;
  team: TeamMember[];
  salesAgentName: string;
};


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilterState>(initialFilterState);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithDetails | null>(null);
  const [projectToView, setProjectToView] = useState<ProjectWithDetails | null>(null);
  const [projectsToDelete, setProjectsToDelete] = useState<ProjectWithDetails[]>([]);
  const [projectsToArchive, setProjectsToArchive] = useState<ProjectWithDetails[]>([]);
  const [bulkAction, setBulkAction] = useState<'assignTeam' | 'changeStatus' | null>(null);


  const searchParams = useSearchParams();
  const { toast } = useToast();


  const refreshData = async () => {
    setLoading(true);
    const [projectsData, clientsData, teamMembersData, eventsData] = await Promise.all([
      getProjects(),
      getClients(),
      getTeamMembers(),
      getEvents(),
    ]);
    setProjects(projectsData);
    setClients(clientsData);
    setTeamMembers(teamMembersData);
    setEvents(eventsData);
    setLoading(false);
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search');
    if (clientId || search || eventId) {
      setFilters(prev => {
        const newFilters = {...prev};
        if (clientId) newFilters.client = clientId;
        if (search) newFilters.search = search;
        if (eventId) newFilters.event = eventId;
        return newFilters;
      });
    }
  }, [searchParams]);

  const projectsWithDetails: ProjectWithDetails[] = useMemo(() => {
    if (loading) return [];
    return projects.map((project) => {
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
  }, [projects, clients, events, teamMembers, loading]);
  
  const availableYears = useMemo(() => {
    if (projects.length === 0) return [];
    const years = new Set(projects.map(p => new Date(p.dates.show.from).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  const filteredProjects = useMemo(() => projectsWithDetails.filter((project) => {
    const searchLower = filters.search.toLowerCase();
    const searchMatch =
      filters.search === "" ||
      project.name.toLowerCase().includes(searchLower) ||
      project.clientName.toLowerCase().includes(searchLower) ||
      project.eventName.toLowerCase().includes(searchLower);

    const statusMatch = filters.status === "all" || project.status === filters.status;
    
    const timelineMatch = 
      !filters.timeline.from || !filters.timeline.to ||
      (project.dates.show.from >= filters.timeline.from && project.dates.show.to <= filters.timeline.to)

    const budgetMatch = project.budget >= filters.budget.min && project.budget <= filters.budget.max;
    
    const clientMatch = filters.client === 'all' || project.clientId === filters.client;

    const priorityMatch = filters.priorities.length === 0 || filters.priorities.includes(project.priority);

    const teamMatch = filters.team.length === 0 || (project.assignedStaff || []).some(id => filters.team.includes(id));

    const eventMatch = filters.event === 'all' || project.eventId === filters.event;

    const dateMatch = (() => {
        if (filters.dateFilter.year === 'all') return true;
        const projectYear = new Date(project.dates.show.from).getFullYear();
        if (projectYear !== filters.dateFilter.year) return false;
        
        if (filters.dateFilter.month === 'all') return true;
        const projectMonth = new Date(project.dates.show.from).getMonth() + 1; // getMonth is 0-indexed
        return projectMonth === filters.dateFilter.month;
    })();

    return searchMatch && statusMatch && timelineMatch && budgetMatch && clientMatch && priorityMatch && teamMatch && eventMatch && dateMatch;
  }), [projectsWithDetails, filters]);

  const sortedFilteredProjects = useMemo(() => {
    // Sort projects by date descending
    return [...filteredProjects].sort((a, b) => new Date(b.dates.show.from).getTime() - new Date(a.dates.show.from).getTime());
  }, [filteredProjects]);

  const handleSelectionChange = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(filteredProjects.map((p) => p.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedProjectIds([]);
  };

  const handleDeleteConfirm = async () => {
    if (projectsToDelete.length === 0) return;
    try {
      await Promise.all(projectsToDelete.map(p => deleteProject(p.id)));
      toast({
        title: "Project(s) Deleted",
        description: `${projectsToDelete.length} project(s) have been successfully deleted.`,
      });
      await refreshData();
      setProjectsToDelete([]);
      setSelectedProjectIds(ids => ids.filter(id => !projectsToDelete.some(p => p.id === id)));
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the project(s). Please try again.",
      });
    }
  };

  const handleBulkExport = () => {
    const selectedProjects = projectsWithDetails.filter(p => selectedProjectIds.includes(p.id));
    
    const headers = ["Project Name", "Event", "Client", "Status", "Budget", "Spent", "Progress", "Start Date", "End Date"];
    const csvContent = [
        headers.join(','),
        ...selectedProjects.map(p => [
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.eventName.replace(/"/g, '""')}"`,
            `"${p.clientName.replace(/"/g, '""')}"`,
            p.status,
            p.budget,
            p.spentBudget,
            p.progress,
            p.dates.show.from.toLocaleDateString(),
            p.dates.show.to.toLocaleDateString()
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "projects_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Export Successful",
        description: `${selectedProjects.length} projects exported.`,
    });
  };

  const handleBulkArchiveConfirm = async () => {
    if (projectsToArchive.length === 0) return;
    try {
      await Promise.all(projectsToArchive.map(p => updateProject({ ...p, status: 'On Hold' })));
      toast({
        title: "Projects Archived",
        description: `${projectsToArchive.length} project(s) have been archived.`,
      });
      await refreshData();
      setProjectsToArchive([]);
      handleClearSelection();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to archive projects. Please try again.",
      });
    }
  };

  const handleBulkAction = (action: 'archive' | 'export' | 'assignTeam' | 'changeStatus' | 'delete') => {
    if (selectedProjectIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No projects selected",
        description: "Please select at least one project.",
      });
      return;
    }
    const selected = filteredProjects.filter(p => selectedProjectIds.includes(p.id));
    
    switch (action) {
      case 'delete':
        setProjectsToDelete(selected);
        break;
      case 'archive':
        setProjectsToArchive(selected);
        break;
      case 'export':
        handleBulkExport();
        break;
      case 'assignTeam':
      case 'changeStatus':
        setBulkAction(action);
        break;
    }
  };


  if (loading) {
    return (
       <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <aside className="lg:col-span-1">
                <Skeleton className="h-[600px] w-full" />
            </aside>
            <main className="lg:col-span-4">
                <Skeleton className="h-[600px] w-full" />
            </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track all your projects in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddProjectDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <aside className="lg:col-span-1">
            <ProjectFilters
              clients={clients}
              staff={teamMembers}
              events={events}
              availableYears={availableYears}
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => setFilters(initialFilterState)}
            />
          </aside>
          <main className="lg:col-span-4">
            <ProjectsTable
              projects={sortedFilteredProjects}
              selectedProjectIds={selectedProjectIds}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onView={(project) => setProjectToView(project)}
              onEdit={(project) => setProjectToEdit(project)}
              onDelete={(project) => setProjectsToDelete([project])}
              onBulkAction={handleBulkAction}
            />
          </main>
        </div>
      </div>
       <AddProjectDialog
        isOpen={isAddProjectDialogOpen}
        onOpenChange={setIsAddProjectDialogOpen}
        onProjectAdded={refreshData}
      />
      {projectToEdit && (
        <EditProjectDialog
          project={projectToEdit}
          isOpen={!!projectToEdit}
          onOpenChange={(isOpen) => !isOpen && setProjectToEdit(null)}
          onProjectUpdated={async () => {
            await refreshData();
            setProjectToEdit(null);
          }}
          clients={clients}
        />
      )}
      {projectToView && (
        <ViewProjectDialog
          project={projectToView}
          isOpen={!!projectToView}
          onOpenChange={(isOpen) => !isOpen && setProjectToView(null)}
        />
      )}
       <ProjectBulkActionsDialog
        open={!!bulkAction}
        onOpenChange={(isOpen) => !isOpen && setBulkAction(null)}
        action={bulkAction}
        selectedProjects={filteredProjects.filter(p => selectedProjectIds.includes(p.id))}
        allTeamMembers={teamMembers}
        onActionComplete={async () => {
            await refreshData();
            handleClearSelection();
            setBulkAction(null);
        }}
      />
      <AlertDialog open={projectsToArchive.length > 0} onOpenChange={(isOpen) => !isOpen && setProjectsToArchive([])}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Archive Projects?</AlertDialogTitle>
            <AlertDialogDescription>
                This will set the status of {projectsToArchive.length} project(s) to 'On Hold'. Are you sure?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectsToArchive([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchiveConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={projectsToDelete.length > 0} onOpenChange={(isOpen) => !isOpen && setProjectsToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{' '}
                {projectsToDelete.length === 1 ? <>the project <span className="font-semibold">{projectsToDelete[0].name}</span></> : `${projectsToDelete.length} projects`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectsToDelete([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
