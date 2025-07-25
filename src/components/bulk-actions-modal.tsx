
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/lib/data";
import { Settings, Calendar as CalendarIcon, Bell, UserCog, Clock } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedMembers: TeamMember[];
  onClearSelection: () => void;
}

const initialWorkingDays = {
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: false,
    Sun: false,
};

type WorkingDays = typeof initialWorkingDays;

export function BulkActionsModal({ isOpen, onOpenChange, selectedMembers, onClearSelection }: BulkActionsModalProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("schedule");

    const [scheduleTemplate, setScheduleTemplate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [workingDays, setWorkingDays] = useState<WorkingDays>(initialWorkingDays);

    const handleWorkingDayChange = (day: keyof WorkingDays, checked: boolean) => {
        setWorkingDays(prev => ({...prev, [day]: checked}));
    };

    const handleUpdateSchedule = () => {
        toast({
          title: "Schedules Updated",
          description: `Schedules for ${selectedMembers.length} member(s) have been updated.`,
        });
        onOpenChange(false);
    };


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="p-3 bg-muted rounded-lg">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl">Bulk Actions</DialogTitle>
                        <DialogDescription>
                            {selectedMembers.length} team member{selectedMembers.length > 1 ? 's' : ''} selected
                        </DialogDescription>
                    </div>
                </DialogHeader>
                
                <div className="py-4">
                    <h4 className="text-sm font-medium mb-2">Selected Team Members</h4>
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedMembers.map(member => (
                            <Badge key={member.id} variant="secondary" className="p-1 pr-2">
                                <Avatar className="h-5 w-5 mr-2">
                                    <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
                                    <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                {member.name}
                            </Badge>
                        ))}
                    </div>
                    <Button variant="link" className="p-0 h-auto text-primary mt-2 text-sm" onClick={onClearSelection}>
                        Clear selection
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="schedule">
                             <CalendarIcon className="mr-2 h-4 w-4" /> Update Schedule
                        </TabsTrigger>
                        <TabsTrigger value="notify">
                             <Bell className="mr-2 h-4 w-4" /> Send Notification
                        </TabsTrigger>
                         <TabsTrigger value="role">
                             <UserCog className="mr-2 h-4 w-4" /> Update Role
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule" className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="schedule-template" className="text-sm font-medium">Schedule Template</label>
                            <Select value={scheduleTemplate} onValueChange={setScheduleTemplate}>
                                <SelectTrigger id="schedule-template">
                                    <SelectValue placeholder="Select template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full-time">Full-time (9-5, Mon-Fri)</SelectItem>
                                    <SelectItem value="part-time">Part-time (mornings)</SelectItem>
                                    <SelectItem value="flexible">Flexible Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="start-time" className="text-sm font-medium">Start Time</label>
                                <div className="relative">
                                    <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="pr-8" />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="end-time" className="text-sm font-medium">End Time</label>
                                <div className="relative">
                                    <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="pr-8" />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Working Days</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-1">
                                {Object.keys(workingDays).map((day) => (
                                     <div key={day} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`day-${day}`}
                                            checked={workingDays[day as keyof WorkingDays]}
                                            onCheckedChange={(checked) => handleWorkingDayChange(day as keyof WorkingDays, !!checked)}
                                        />
                                        <label
                                            htmlFor={`day-${day}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {day}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <Button className="w-full bg-green-500 text-white hover:bg-green-600" size="lg" onClick={handleUpdateSchedule}>
                           <CalendarIcon className="mr-2 h-4 w-4" /> Update Schedule
                        </Button>
                    </TabsContent>
                    <TabsContent value="notify"><p className="text-center text-muted-foreground pt-6">Notification options coming soon.</p></TabsContent>
                    <TabsContent value="role"><p className="text-center text-muted-foreground pt-6">Role update options coming soon.</p></TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
