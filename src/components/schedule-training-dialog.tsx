
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { addTrainingSession } from "@/lib/database";
import type { TeamMember } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";

const trainingFormSchema = z.object({
  courseName: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Description is required"),
  dates: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  attendees: z.array(z.string()).min(1, "At least one team member must be selected"),
});

type TrainingFormValues = z.infer<typeof trainingFormSchema>;

interface ScheduleTrainingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTrainingScheduled: () => void;
  teamMembers: TeamMember[];
}

export function ScheduleTrainingDialog({ isOpen, onOpenChange, onTrainingScheduled, teamMembers }: ScheduleTrainingDialogProps) {
  const { toast } = useToast();
  const [staffSearch, setStaffSearch] = React.useState("");

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      courseName: "",
      description: "",
      dates: { from: undefined, to: undefined },
      attendees: [],
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset();
      setStaffSearch("");
    }
  }, [isOpen, form]);

  const onSubmit = async (data: TrainingFormValues) => {
    try {
      await addTrainingSession(data);
      toast({
        title: "Training Scheduled",
        description: `${data.courseName} has been scheduled.`,
      });
      onTrainingScheduled();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule training. Please try again.",
      });
    }
  };
  
  const filteredStaff = teamMembers.filter(member => {
    const searchTerm = staffSearch.toLowerCase();
    return member.name.toLowerCase().includes(searchTerm) || member.role.toLowerCase().includes(searchTerm);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Training Session</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new training for your team.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="courseName" render={({ field }) => (
                <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input placeholder="e.g., Advanced Rigging" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Briefly describe the training session..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="dates" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Training Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn( "w-full pl-3 text-left font-normal", !field.value?.from && "text-muted-foreground" )}>
                          {field.value?.from ? ( field.value.to ? (
                              <> {format(field.value.from, "LLL dd, y")} -{" "} {format(field.value.to, "LLL dd, y")} </>
                            ) : ( format(field.value.from, "LLL dd, y") )
                          ) : ( <span>Pick a date range</span> )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="range" selected={{from: field.value?.from, to: field.value?.to}} onSelect={field.onChange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}/>
            <FormField control={form.control} name="attendees" render={() => (
                <FormItem>
                  <FormLabel>Assign Attendees</FormLabel>
                  <div className="relative my-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search staff..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="pl-9" />
                  </div>
                  <ScrollArea className="h-40 rounded-md border p-2">
                    {filteredStaff.map((member) => (
                      <FormField key={member.id} control={form.control} name="attendees" render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), member.id])
                                    : field.onChange( field.value?.filter( (value) => value !== member.id ) );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal w-full cursor-pointer">
                              <div className="flex justify-between items-center">
                                <span>{member.name}</span>
                                <span className="text-muted-foreground text-xs">{member.role}</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
