
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { addTrainingSession } from "@/lib/database";

interface AssignTrainingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onActionComplete: () => void;
}

const trainingCourses = [
    "Advanced Lighting Techniques",
    "Audio Engineering Masterclass",
    "Project Management for Events",
    "Safety and Rigging Certification",
];

export function AssignTrainingDialog({ 
    isOpen, 
    onOpenChange, 
    member, 
    onActionComplete 
}: AssignTrainingDialogProps) {
    const { toast } = useToast();
    const [selectedCourse, setSelectedCourse] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedCourse('');
            setDateRange(undefined);
        }
    }, [isOpen]);

    if (!member) return null;

    const handleSubmit = () => {
        if (!selectedCourse || !dateRange?.from || !dateRange?.to) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please select a course and a date range for the training." });
            return;
        }
        setIsSubmitting(true);
        try {
            addTrainingSession({
                courseName: selectedCourse,
                description: `Training session for ${selectedCourse}`, // Simple description
                dates: { from: dateRange.from, to: dateRange.to },
                attendees: [member.id],
            });

             toast({ 
                title: "Training Assigned",
                description: `${selectedCourse} has been assigned to ${member.name} from ${format(dateRange.from!, 'PPP')} to ${format(dateRange.to!, 'PPP')}.` 
            });
            onActionComplete();
        } catch(e) {
            toast({ variant: "destructive", title: "Error assigning training" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Training</DialogTitle>
                    <DialogDescription>
                        Assign a training course to {member.name}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Training Course</label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {trainingCourses.map(course => (
                                    <SelectItem key={course} value={course}>{course}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Training Dates</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
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
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Assigning..." : "Assign Training"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
