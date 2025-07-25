
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Client, ProjectStatus, Priority, TeamMember, Event } from "@/lib/data";
import { Filter, Calendar as CalendarIcon, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DateRange } from "react-day-picker";

export interface ProjectFilterState {
  search: string;
  status: ProjectStatus | "all";
  timeline: DateRange;
  budget: { min: number; max: number };
  client: string;
  priorities: Priority[];
  team: string[];
  event: string;
  dateFilter: {
    year: number | 'all';
    month: number | 'all';
  };
}

interface ProjectFiltersProps {
  clients: Client[];
  staff: TeamMember[];
  events: Event[];
  availableYears: number[];
  filters: ProjectFilterState;
  onFilterChange: (filters: ProjectFilterState) => void;
  onClearFilters: () => void;
}

const priorityOptions: { id: Priority; label: string; color: string }[] = [
    { id: "High", label: "High", color: "bg-red-500" },
    { id: "Medium", label: "Medium", color: "bg-yellow-500" },
    { id: "Low", label: "Low", color: "bg-green-500" },
]

export function ProjectFilters({
  clients,
  staff,
  events,
  availableYears,
  filters,
  onFilterChange,
  onClearFilters,
}: ProjectFiltersProps) {

  const handleFilterChange = <K extends keyof ProjectFilterState>(key: K, value: ProjectFilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  const handlePriorityChange = (priority: Priority) => {
    const newPriorities = filters.priorities.includes(priority)
        ? filters.priorities.filter(p => p !== priority)
        : [...filters.priorities, priority];
    handleFilterChange('priorities', newPriorities);
  }

  const handleTeamChange = (memberId: string) => {
    const newTeam = filters.team.includes(memberId)
        ? filters.team.filter(id => id !== memberId)
        : [...filters.team, memberId];
    handleFilterChange('team', newTeam);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <CardTitle className="text-xl">Filters</CardTitle>
        </div>
        <Button variant="link" className="text-sm" onClick={onClearFilters}>
          Clear All
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Projects</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, client..." 
              className="pl-9"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
        {/* Year Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Year</label>
          <Select
             value={String(filters.dateFilter.year)}
             onValueChange={(value) => handleFilterChange('dateFilter', { year: value === 'all' ? 'all' : Number(value), month: 'all' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Month</label>
          <Select
             value={String(filters.dateFilter.month)}
             onValueChange={(value) => handleFilterChange('dateFilter', { ...filters.dateFilter, month: value === 'all' ? 'all' : Number(value) })}
             disabled={filters.dateFilter.year === 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{format(new Date(2000, i), 'MMMM')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Event */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Event</label>
          <Select
             value={filters.event}
             onValueChange={(value) => handleFilterChange('event', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Status</label>
          <Select
            value={filters.status}
            onValueChange={(value: ProjectStatus | "all") => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Timeline */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Project Timeline</label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.timeline?.from && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.timeline?.from ? (
                    filters.timeline.to ? (
                        <>
                        {format(filters.timeline.from, "LLL dd, y")} -{" "}
                        {format(filters.timeline.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(filters.timeline.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.timeline?.from}
                    selected={filters.timeline}
                    onSelect={(range) => handleFilterChange('timeline', range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </div>
        {/* Budget */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Budget Range</label>
            <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.budget.min}
                  onChange={e => handleFilterChange('budget', { ...filters.budget, min: Number(e.target.value)})}
                  className="w-1/2" 
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.budget.max}
                  onChange={e => handleFilterChange('budget', { ...filters.budget, max: Number(e.target.value)})}
                  className="w-1/2" 
                />
            </div>
            <Slider
                value={[filters.budget.min, filters.budget.max]}
                onValueChange={([min, max]) => handleFilterChange('budget', {min, max})}
                max={1000000}
                step={10000}
                className="pt-2"
            />
        </div>
        {/* Client */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Client</label>
          <Select
             value={filters.client}
             onValueChange={(value) => handleFilterChange('client', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Priority */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
           <div className="space-y-2 pt-1">
            {priorityOptions.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                 <Checkbox 
                  id={`priority-${p.id}`}
                  checked={filters.priorities.includes(p.id)}
                  onCheckedChange={() => handlePriorityChange(p.id)}
                 />
                 <label htmlFor={`priority-${p.id}`} className="flex items-center gap-2 cursor-pointer">
                    <span className={cn("h-2.5 w-2.5 rounded-full", p.color)}></span>
                    <span className="text-sm font-medium">{p.label}</span>
                 </label>
              </div>
            ))}
          </div>
        </div>
         {/* Team Members */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Team Members</label>
          <div className="space-y-3 pt-1">
            {staff.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={`member-${member.id}`} 
                      checked={filters.team.includes(member.id)}
                      onCheckedChange={() => handleTeamChange(member.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleTeamChange(member.id)}>
                        <Avatar className="h-7 w-7">
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
      </CardContent>
    </Card>
  );
}
