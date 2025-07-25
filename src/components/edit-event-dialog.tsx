
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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { updateEvent, getEventTypes } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/lib/data";

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  acronym: z.string().min(1, "Acronym is required"),
  showWebsite: z.string().url({ message: "Please enter a valid URL." }).or(z.literal("")).optional(),
  eventType: z.string().min(1, "Event type is required"),
  location: z.string().min(1, "Location is required"),
  dates: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEventUpdated: () => Promise<void>;
  event: Event;
}

export function EditEventDialog({ isOpen, onOpenChange, onEventUpdated, event }: EditEventDialogProps) {
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = React.useState<string[]>([]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      acronym: "",
      showWebsite: "",
      eventType: "",
      location: "",
      dates: {
        from: undefined,
        to: undefined,
      },
    },
  });

  React.useEffect(() => {
    if (isOpen && event) {
      getEventTypes().then(allTypes => {
          if (event.eventType && !allTypes.includes(event.eventType)) {
              allTypes.unshift(event.eventType);
          }
          setEventTypes(allTypes);
      });

      form.reset({
        name: event.name,
        acronym: event.acronym,
        showWebsite: event.showWebsite || "",
        eventType: event.eventType,
        location: event.location,
        dates: {
          from: new Date(event.dates.from),
          to: new Date(event.dates.to)
        },
      });
    }
  }, [isOpen, event, form]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      await updateEvent({
        ...event,
        ...data,
        showWebsite: data.showWebsite || "",
      });
      toast({
        title: "Event Updated",
        description: `${data.name} has been successfully updated.`,
      });
      await onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the event. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details for {event.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., LA Auto Show 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="acronym"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Acronym</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., LAAS 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {eventTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                control={form.control}
                name="showWebsite"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Show Website (Optional)</FormLabel>
                    <FormControl>
                        <Input type="url" placeholder="https://..." value={field.value ?? ''} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Los Angeles Convention Center" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value?.from && "text-muted-foreground"
                          )}
                        >
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, y")} -{" "}
                                {format(field.value.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{from: field.value?.from, to: field.value?.to}}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
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
