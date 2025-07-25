
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember, PtoRequest } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { addPtoRequest } from "@/lib/database";

interface AssignPtoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onActionComplete: () => void;
}

const ptoTypes: PtoRequest['type'][] = ["Vacation", "Sick Leave", "Personal Day"];

export function AssignPtoDialog({ 
    isOpen, 
    onOpenChange, 
    member, 
    onActionComplete 
}: AssignPtoDialogProps) {
    const { toast } = useToast();
    const [ptoType, setPtoType] = useState<PtoRequest['type'] | ''>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPtoType('');
            setDateRange(undefined);
        }
    }, [isOpen]);

    if (!member) return null;

    const handleSubmit = () => {
        if (!ptoType || !dateRange?.from || !dateRange?.to) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please select a PTO type and a date range." });
            return;
        }
        setIsSubmitting(true);
        try {
            addPtoRequest({
                type: ptoType,
                dates: { from: dateRange.from, to: dateRange.to },
            }, [member.id]);

             toast({ 
                title: "PTO Assigned",
                description: `${ptoType} has been scheduled for ${member.name} from ${format(dateRange.from!, 'PPP')} to ${format(dateRange.to!, 'PPP')}.` 
            });
            onActionComplete();
        } catch(e) {
             toast({ variant: "destructive", title: "Error assigning PTO" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign PTO</DialogTitle>
                    <DialogDescription>
                        Schedule Paid Time Off for {member.name}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">PTO Type</label>
                        <Select value={ptoType} onValueChange={(v: PtoRequest['type']) => setPtoType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ptoTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
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
                        {isSubmitting ? "Scheduling..." : "Schedule PTO"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
