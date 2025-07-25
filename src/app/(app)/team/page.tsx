
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  List,
  Grip,
  Search,
  UserPlus,
  Upload,
  Trash2,
  CheckCircle2,
  Archive,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMember, Project, Client, Event } from "@/lib/data";
import { getTeamMembers, deleteTeamMember, getProjects, getClients, getEvents, updateTeamMember } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamDirectoryCard } from "@/components/team-directory-card";
import { cn } from "@/lib/utils";
import { TeamMemberCard } from "@/components/team-member-card";
import { AddTeamMemberDialog } from "@/components/add-team-member-dialog";
import { EditTeamMemberDialog } from "@/components/edit-team-member-dialog";
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
import { ViewTeamMemberDialog } from "@/components/view-team-member-dialog";
import { ViewMemberProjectsDialog } from "@/components/view-member-projects-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignProjectsDialog } from "@/components/assign-projects-dialog";
import { AssignTrainingDialog } from "@/components/assign-training-dialog";
import { AssignPtoDialog } from "@/components/assign-pto-dialog";
import { ImportTeamDialog } from "@/components/import-team-dialog";


export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAssignProjectsDialogOpen, setIsAssignProjectsDialogOpen] = useState(false);
  const [isAssignTrainingDialogOpen, setIsAssignTrainingDialogOpen] = useState(false);
  const [isAssignPtoDialogOpen, setIsAssignPtoDialogOpen] = useState(false);
  const [isImportTeamDialogOpen, setIsImportTeamDialogOpen] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [membersToDelete, setMembersToDelete] = useState<TeamMember[]>([]);
  const [membersToArchive, setMembersToArchive] = useState<TeamMember[]>([]);
  const [memberToView, setMemberToView] = useState<TeamMember | null>(null);
  const [memberToViewProjects, setMemberToViewProjects] = useState<TeamMember | null>(null);
  const [membersForAssignment, setMembersForAssignment] = useState<TeamMember[]>([]);
  const [memberForAction, setMemberForAction] = useState<TeamMember | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = async () => {
    setLoading(true);
    const [teamData, projectsData, clientsData, eventsData] = await Promise.all([
        getTeamMembers(),
        getProjects(),
        getClients(),
        getEvents()
    ]);

    setTeamMembers(teamData);
    setProjects(projectsData);
    setClients(clientsData);
    setEvents(eventsData);
    setLoading(false);
  };
  
  useEffect(() => {
    refreshData();
  }, []);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(teamMembers.map(m => m.department))];
  }, [teamMembers]);

  const filteredAndSortedMembers = useMemo(() => {
    let members = teamMembers
      .filter(member => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchMatch = searchTerm.trim() === '' ||
            member.name.toLowerCase().includes(lowerSearchTerm) ||
            member.role.toLowerCase().includes(lowerSearchTerm) ||
            member.department.toLowerCase().includes(lowerSearchTerm);
        
        const departmentMatch = departmentFilter === 'all' || member.department === departmentFilter;
        
        return searchMatch && departmentMatch;
      });

    switch(sortOrder) {
        case 'name-asc':
            members.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            members.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }

    return members;
  }, [teamMembers, searchTerm, departmentFilter, sortOrder]);
  
  const handleSelectionChange = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };
  
  const handleClearSelection = () => {
    setSelectedMemberIds([]);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    try {
      await deleteTeamMember(memberToDelete.id);
      toast({
        title: "Team Member Deleted",
        description: `${memberToDelete.name} has been successfully deleted.`,
      });
      refreshData();
      setMemberToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the team member. Please try again.",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(filteredAndSortedMembers.map((m) => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const downloadCSV = (membersToExport: TeamMember[], filename: string) => {
    if (membersToExport.length === 0) {
      toast({ variant: "destructive", title: "No members to export" });
      return;
    }
    const headers = ["name", "role", "department", "email", "phone", "avatarUrl"];
    const csvContent = [
      headers.join(','),
      ...membersToExport.map(m => [
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.role.replace(/"/g, '""')}"`,
        `"${m.department.replace(/"/g, '""')}"`,
        m.email,
        m.phone,
        m.avatarUrl || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${membersToExport.length} team members exported.`,
    });
  };

  const handleExportSelected = () => {
    const selectedMembers = teamMembers.filter(m => selectedMemberIds.includes(m.id));
    downloadCSV(selectedMembers, "selected_team_export.csv");
  }

  const handleExportAll = () => {
     downloadCSV(teamMembers, "all_team_export.csv");
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportedFile(file);
      setIsImportTeamDialogOpen(true);
      // Reset file input value to allow re-uploading the same file
      event.target.value = '';
    }
  };


  const handleBulkDeleteConfirm = async () => {
    if (membersToDelete.length === 0) return;
    try {
      await Promise.all(membersToDelete.map(m => deleteTeamMember(m.id)));
      toast({
        title: "Team Member(s) Deleted",
        description: `${membersToDelete.length} member(s) have been successfully deleted.`,
      });
      refreshData();
      setMembersToDelete([]);
      setSelectedMemberIds(ids => ids.filter(id => !membersToDelete.some(m => m.id === id)));
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the member(s). Please try again.",
      });
    }
  };

  const handleBulkArchiveConfirm = async () => {
    if (membersToArchive.length === 0) return;
    
    try {
        await Promise.all(membersToArchive.map(m => updateTeamMember({ ...m, status: 'Archived' })));
        toast({
            title: "Members Archived",
            description: `${membersToArchive.length} member(s) have been archived.`,
        });
        await refreshData();
        setMembersToArchive([]);
        handleClearSelection();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to archive members. Please try again.",
        });
    }
  };
  
  const handleAssignProjectToMember = (member: TeamMember) => {
    setMembersForAssignment([member]);
    setIsAssignProjectsDialogOpen(true);
  };
  
  const handleAssignTrainingToMember = (member: TeamMember) => {
    setMemberForAction(member);
    setIsAssignTrainingDialogOpen(true);
  };
  
  const handleAssignPtoToMember = (member: TeamMember) => {
    setMemberForAction(member);
    setIsAssignPtoDialogOpen(true);
  };

  const handleBulkAction = (action: 'archive' | 'export' | 'assignProject' | 'delete') => {
    if (selectedMemberIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No members selected",
        description: "Please select at least one team member.",
      });
      return;
    }
    const selected = filteredAndSortedMembers.filter(m => selectedMemberIds.includes(m.id));
    
    switch (action) {
      case 'delete':
        setMembersToDelete(selected);
        break;
      case 'archive':
        setMembersToArchive(selected);
        break;
      case 'export':
        handleExportSelected();
        break;
      case 'assignProject':
        setMembersForAssignment(selected);
        setIsAssignProjectsDialogOpen(true);
        break;
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[700px] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              Manage team members, schedules, and resource allocation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddMemberDialogOpen(true)}>
              <UserPlus className="mr-2" /> Add Member
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileSelected}
            />
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="mr-2" /> Import Team
            </Button>
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="mr-2" /> Export Team
            </Button>
          </div>
        </div>

        {/* Filters & View */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col md:flex-row gap-2">
            <div className="relative w-full md:w-auto md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search team members..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Button variant="outline" size="icon" className={cn("h-9 w-9", viewMode === 'grid' && 'bg-secondary')} onClick={() => setViewMode('grid')}>
              <Grip className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className={cn("h-9 w-9", viewMode === 'list' && 'bg-secondary')} onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Sort by Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Sort by Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMemberIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">
                      {selectedMemberIds.length} member
                      {selectedMemberIds.length > 1 ? "s" : ""} selected
                  </span>
                  </div>
                  <Button
                  variant="link"
                  onClick={handleClearSelection}
                  className="text-primary p-0 h-auto text-sm"
                  >
                  Clear selection
                  </Button>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                      <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                  </Button>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button size="sm">
                              More actions <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleBulkAction('assignProject')}>
                              <UserPlus className="mr-2 h-4 w-4" /> Assign to Projects
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                              <Archive className="mr-2 h-4 w-4" /> Archive Members
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                              <Download className="mr-2 h-4 w-4" /> Export Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleBulkAction('delete')}
                          >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Members
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
        )}

        {/* Main Content */}
        {viewMode === 'list' ? (
           <TeamDirectoryCard
              members={filteredAndSortedMembers}
              selectedMemberIds={selectedMemberIds}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
              onEdit={setMemberToEdit}
              onDelete={setMemberToDelete}
              onViewDetails={setMemberToView}
              onViewProjects={setMemberToViewProjects}
              onAssignProjects={handleAssignProjectToMember}
              onAssignTraining={handleAssignTrainingToMember}
              onAssignPto={handleAssignPtoToMember}
            />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedMembers.map(member => (
                  <TeamMemberCard 
                      key={member.id} 
                      member={member} 
                      isSelected={selectedMemberIds.includes(member.id)}
                      onSelectionChange={handleSelectionChange}
                  />
              ))}
          </div>
        )}
      </div>
      <AddTeamMemberDialog
        isOpen={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        onMemberAdded={refreshData}
      />
      {importedFile && (
        <ImportTeamDialog
            isOpen={isImportTeamDialogOpen}
            onOpenChange={setIsImportTeamDialogOpen}
            file={importedFile}
            onImportComplete={async () => {
                await refreshData();
                setIsImportTeamDialogOpen(false);
                setImportedFile(null);
            }}
        />
      )}
      {memberToEdit && (
        <EditTeamMemberDialog
          member={memberToEdit}
          isOpen={!!memberToEdit}
          onOpenChange={(isOpen) => !isOpen && setMemberToEdit(null)}
          onMemberUpdated={() => {
            refreshData();
            setMemberToEdit(null);
          }}
        />
      )}
       {memberToView && (
        <ViewTeamMemberDialog
          member={memberToView}
          isOpen={!!memberToView}
          onOpenChange={(isOpen) => !isOpen && setMemberToView(null)}
        />
      )}
      {memberToViewProjects && (
        <ViewMemberProjectsDialog
          member={memberToViewProjects}
          projects={projects}
          clients={clients}
          events={events}
          isOpen={!!memberToViewProjects}
          onOpenChange={(isOpen) => !isOpen && setMemberToViewProjects(null)}
        />
      )}
       <AssignProjectsDialog
        isOpen={isAssignProjectsDialogOpen}
        onOpenChange={setIsAssignProjectsDialogOpen}
        selectedMembers={membersForAssignment}
        allProjects={projects}
        allEvents={events}
        allClients={clients}
        onActionComplete={async () => {
            await refreshData();
            handleClearSelection();
            setIsAssignProjectsDialogOpen(false);
        }}
      />
      <AssignTrainingDialog
        isOpen={isAssignTrainingDialogOpen}
        onOpenChange={setIsAssignTrainingDialogOpen}
        member={memberForAction}
        onActionComplete={() => {
            setIsAssignTrainingDialogOpen(false);
            setMemberForAction(null);
        }}
      />
      <AssignPtoDialog
        isOpen={isAssignPtoDialogOpen}
        onOpenChange={setIsAssignPtoDialogOpen}
        member={memberForAction}
        onActionComplete={() => {
            setIsAssignPtoDialogOpen(false);
            setMemberForAction(null);
        }}
      />
      <AlertDialog open={!!memberToDelete} onOpenChange={(isOpen) => !isOpen && setMemberToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{' '}
                <span className="font-semibold">{memberToDelete?.name}</span> from the team.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={membersToDelete.length > 0} onOpenChange={(isOpen) => !isOpen && setMembersToDelete([])}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {membersToDelete.length} team member(s).
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMembersToDelete([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={membersToArchive.length > 0} onOpenChange={(isOpen) => !isOpen && setMembersToArchive([])}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Archive Team Members?</AlertDialogTitle>
            <AlertDialogDescription>
                This will mark {membersToArchive.length} team member(s) as inactive. They will be hidden from most views but can be restored later. Are you sure?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMembersToArchive([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchiveConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    