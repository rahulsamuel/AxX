
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamMember, ProjectStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { CalendarFilterState } from "@/app/(app)/calendar/page";

const projectStatusOptions: { label: ProjectStatus; color: string }[] = [
  { label: "Planning", color: "bg-purple-500" },
  { label: "Setup", color: "bg-yellow-500" },
  { label: "In Progress", color: "bg-blue-500" },
  { label: "Completed", color: "bg-green-500" },
  { label: "On Hold", color: "bg-gray-500" },
];

const eventTypeOptions = [
    { label: "Projects", color: "bg-indigo-500" },
    { label: "Training", color: "bg-orange-500" },
    { label: "PTO", color: "bg-teal-500" },
];

interface CalendarFiltersProps {
    staff: TeamMember[];
    selectedFilters: CalendarFilterState;
    onFilterChange: (filters: CalendarFilterState) => void;
}

export function CalendarFilters({ staff, selectedFilters, onFilterChange }: CalendarFiltersProps) {

  const handleStatusChange = (status: ProjectStatus, checked: boolean) => {
    const newStatus = checked
      ? [...selectedFilters.status, status]
      : selectedFilters.status.filter(s => s !== status);
    onFilterChange({ ...selectedFilters, status: newStatus });
  };

  const handleMemberChange = (memberId: string, checked: boolean) => {
    const newMembers = checked
      ? [...selectedFilters.members, memberId]
      : selectedFilters.members.filter(id => id !== memberId);
    onFilterChange({ ...selectedFilters, members: newMembers });
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    const newEventTypes = checked
      ? [...selectedFilters.eventTypes, eventType]
      : selectedFilters.eventTypes.filter(s => s !== eventType);
    onFilterChange({ ...selectedFilters, eventTypes: newEventTypes });
  };

  return (
    <div className="pr-4">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Event Types</h4>
          <div className="space-y-3">
            {eventTypeOptions.map((type) => (
              <div key={type.label} className="flex items-center gap-3">
                <Checkbox 
                  id={`type-${type.label}`} 
                  checked={selectedFilters.eventTypes.includes(type.label)}
                  onCheckedChange={(checked) => handleEventTypeChange(type.label, !!checked)}
                />
                <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleEventTypeChange(type.label, !selectedFilters.eventTypes.includes(type.label))}>
                    <span className={cn("h-2.5 w-2.5 rounded-full", type.color)}></span>
                    <label htmlFor={`type-${type.label}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    {type.label}
                    </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Project Status</h4>
          <div className="space-y-3">
            {projectStatusOptions.map((status) => (
              <div key={status.label} className="flex items-center gap-3">
                <Checkbox 
                  id={`status-${status.label}`} 
                  checked={selectedFilters.status.includes(status.label)}
                  onCheckedChange={(checked) => handleStatusChange(status.label, !!checked)}
                  disabled={!selectedFilters.eventTypes.includes('Projects')}
                />
                <div className={cn("flex items-center gap-2 flex-1", !selectedFilters.eventTypes.includes('Projects') ? 'opacity-50' : 'cursor-pointer')} onClick={() => {if(selectedFilters.eventTypes.includes('Projects')) { handleStatusChange(status.label, !selectedFilters.status.includes(status.label))}}}>
                    <span className={cn("h-2.5 w-2.5 rounded-full", status.color)}></span>
                    <label htmlFor={`status-${status.label}`} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", selectedFilters.eventTypes.includes('Projects') ? 'cursor-pointer' : 'cursor-not-allowed')}>
                    {status.label}
                    </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Team Members</h4>
            <div className="space-y-3">
            {staff.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={`member-${member.id}`} 
                      checked={selectedFilters.members.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberChange(member.id, !!checked)}
                    />
                    <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleMemberChange(member.id, !selectedFilters.members.includes(member.id))}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <label htmlFor={`member-${member.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            {member.name}
                        </label>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
