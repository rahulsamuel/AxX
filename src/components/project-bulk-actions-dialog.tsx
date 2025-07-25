
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateProject } from "@/lib/database";
import type { Project, TeamMember, ProjectStatus } from "@/lib/data";

type ProjectWithClientAndTeam = Project & {
    clientName: string;
    team: TeamMember[];
};

interface ProjectBulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'assignTeam' | 'changeStatus' | null;
  selectedProjects: ProjectWithClientAndTeam[];
  allTeamMembers: TeamMember[];
  onActionComplete: () => Promise<void>;
}

export function ProjectBulkActionsDialog({ open, onOpenChange, action, selectedProjects, allTeamMembers, onActionComplete }: ProjectBulkActionsDialogProps) {
    const { toast } = useToast();
    const [staffSearch, setStaffSearch] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    const [newStatus, setNewStatus] = useState<ProjectStatus | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setStaffSearch('');
            setSelectedStaff([]);
            setNewStatus('');
        }
    }, [open]);

    const handleAssignTeam = async () => {
        if (selectedStaff.length === 0) {
            toast({ variant: "destructive", title: "No team members selected" });
            return;
        }
        setIsSubmitting(true);
        try {
            await Promise.all(selectedProjects.map(project => {
                const updatedStaff = [...new Set([...project.assignedStaff, ...selectedStaff])];
                return updateProject({ ...project, assignedStaff: updatedStaff });
            }));
            toast({ title: "Team members assigned successfully" });
            await onActionComplete();
        } catch (e) {
            toast({ variant: "destructive", title: "Error assigning team members" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangeStatus = async () => {
        if (!newStatus) {
            toast({ variant: "destructive", title: "No status selected" });
            return;
        }
        setIsSubmitting(true);
        try {
            await Promise.all(selectedProjects.map(project => {
                return updateProject({ ...project, status: newStatus });
            }));
            toast({ title: "Project statuses updated successfully" });
            await onActionComplete();
        } catch (e) {
            toast({ variant: "destructive", title: "Error updating statuses" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = () => {
        if (action === 'assignTeam') {
            handleAssignTeam();
        } else if (action === 'changeStatus') {
            handleChangeStatus();
        }
    };

    const filteredStaff = allTeamMembers.filter(member => {
        const searchTerm = staffSearch.toLowerCase();
        return member.name.toLowerCase().includes(searchTerm) || member.role.toLowerCase().includes(searchTerm);
    });
    
    const title = action === 'assignTeam' ? "Assign Team Members" : "Change Project Status";
    const description = `Applying action to ${selectedProjects.length} project(s).`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                
                {action === 'assignTeam' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder="Search staff by name or role..."
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            className="pl-9"
                            />
                        </div>
                        <ScrollArea className="h-64 border rounded-md p-2">
                             {filteredStaff.length > 0 ? (
                                filteredStaff.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-3 py-2 px-1">
                                        <Checkbox
                                            id={`bulk-assign-${member.id}`}
                                            checked={selectedStaff.includes(member.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedStaff(prev => checked ? [...prev, member.id] : prev.filter(id => id !== member.id));
                                            }}
                                        />
                                        <label htmlFor={`bulk-assign-${member.id}`} className="font-normal w-full cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <span>{member.name}</span>
                                                <span className="text-muted-foreground text-xs">{member.role}</span>
                                            </div>
                                        </label>
                                    </div>
                                ))
                             ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">No staff members found.</p>
                             )}
                        </ScrollArea>
                    </div>
                )}

                {action === 'changeStatus' && (
                     <div className="space-y-2 py-4">
                        <label className="text-sm font-medium">New Status</label>
                        <Select value={newStatus} onValueChange={(value: ProjectStatus) => setNewStatus(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a new status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planning">Planning</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Setup">Setup</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
