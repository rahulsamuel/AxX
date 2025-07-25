
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateProject } from "@/lib/database";
import type { Project, TeamMember, Event, Client } from "@/lib/data";

interface AssignProjectsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMembers: TeamMember[];
  allProjects: Project[];
  allEvents: Event[];
  allClients: Client[];
  onActionComplete: () => Promise<void>;
}

export function AssignProjectsDialog({ 
    isOpen, 
    onOpenChange, 
    selectedMembers, 
    allProjects, 
    allEvents,
    allClients,
    onActionComplete 
}: AssignProjectsDialogProps) {
    const { toast } = useToast();
    const [projectSearch, setProjectSearch] = useState("");
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setProjectSearch('');
            setSelectedProjectIds([]);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (selectedProjectIds.length === 0) {
            toast({ variant: "destructive", title: "No projects selected", description: "Please select at least one project to assign members to." });
            return;
        }
        setIsSubmitting(true);
        try {
            const memberIdsToAdd = selectedMembers.map(m => m.id);

            await Promise.all(selectedProjectIds.map(projectId => {
                const project = allProjects.find(p => p.id === projectId);
                if (project) {
                    const updatedStaff = [...new Set([...project.assignedStaff, ...memberIdsToAdd])];
                    return updateProject({ ...project, assignedStaff: updatedStaff });
                }
                return Promise.resolve();
            }));

            toast({ 
                title: "Projects Assigned",
                description: `${selectedMembers.length} member(s) have been assigned to ${selectedProjectIds.length} project(s).` 
            });
            await onActionComplete();
        } catch (e) {
            toast({ variant: "destructive", title: "Error assigning projects", description: "An error occurred while assigning projects. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const projectsWithDetails = allProjects.map(p => ({
        ...p,
        eventName: allEvents.find(e => e.id === p.eventId)?.name || 'N/A',
        clientName: allClients.find(c => c.id === p.clientId)?.name || 'N/A'
    }));
    
    const filteredProjects = projectsWithDetails.filter(project => {
        const searchTerm = projectSearch.toLowerCase();
        const searchMatch = project.name.toLowerCase().includes(searchTerm) || 
               project.eventName.toLowerCase().includes(searchTerm) ||
               project.clientName.toLowerCase().includes(searchTerm);

        if (!searchMatch) return false;

        // Don't show projects where all selected members are already assigned
        const allSelectedMembersAreAssigned = selectedMembers.every(member => 
            project.assignedStaff.includes(member.id)
        );

        return !allSelectedMembersAreAssigned;
    });

    const memberNames = selectedMembers.map(m => m.name).join(', ');

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assign Projects</DialogTitle>
                    <DialogDescription>
                        Assign {memberNames} to one or more projects.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="pl-9"
                        />
                    </div>
                    <ScrollArea className="h-64 border rounded-md p-2">
                         {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <div key={project.id} className="flex items-start space-x-3 py-2 px-1">
                                    <Checkbox
                                        id={`assign-project-${project.id}`}
                                        checked={selectedProjectIds.includes(project.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedProjectIds(prev => checked ? [...prev, project.id] : prev.filter(id => id !== project.id));
                                        }}
                                        className="mt-1"
                                    />
                                    <label htmlFor={`assign-project-${project.id}`} className="font-normal w-full cursor-pointer">
                                        <div className="font-medium">{project.name}</div>
                                        <div className="text-sm text-muted-foreground">{project.eventName} &middot; {project.clientName}</div>
                                    </label>
                                </div>
                            ))
                         ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No available projects found.</p>
                         )}
                    </ScrollArea>
                </div>
                
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Assigning..." : `Assign to ${selectedProjectIds.length} Project(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
