
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { updatePtoRequest } from "@/lib/database";
import type { PtoRequest, TeamMember } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


const ptoFormSchema = z.object({
  type: z.enum(["Vacation", "Sick Leave", "Personal Day"], {
    required_error: "You need to select a PTO type.",
  }),
  dates: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  teamMemberId: z.string().min(1, "A team member must be selected"),
});

type PtoFormValues = z.infer<typeof ptoFormSchema>;

interface EditPtoRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPtoUpdated: () => void;
  teamMembers: TeamMember[];
  request: PtoRequest;
}

export function EditPtoRequestDialog({ isOpen, onOpenChange, onPtoUpdated, teamMembers, request }: EditPtoRequestDialogProps) {
  const { toast } = useToast();

  const form = useForm<PtoFormValues>({
    resolver: zodResolver(ptoFormSchema),
  });

  React.useEffect(() => {
    if (isOpen && request) {
      form.reset({
        type: request.type,
        dates: {
            from: new Date(request.dates.from),
            to: new Date(request.dates.to),
        },
        teamMemberId: request.teamMemberId,
      });
    }
  }, [isOpen, request, form]);

  const onSubmit = async (data: PtoFormValues) => {
    try {
      await updatePtoRequest({
        ...request,
        ...data,
      });
      toast({
        title: "PTO Updated",
        description: `The PTO request has been updated.`,
      });
      onPtoUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update PTO request. Please try again.",
      });
    }
  };
  
  const ptoTypes = ["Vacation", "Sick Leave", "Personal Day"];
  const member = teamMembers.find(m => m.id === request.teamMemberId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit PTO for {member?.name}</DialogTitle>
          <DialogDescription>
            Update the details for this time off request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>PTO Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ptoTypes.map(type => ( <SelectItem key={type} value={type}>{type}</SelectItem> ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
             <FormField control={form.control} name="dates" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Dates</FormLabel>
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
            <FormField control={form.control} name="teamMemberId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers.map(tm => ( <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem> ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    