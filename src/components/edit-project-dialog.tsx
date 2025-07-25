
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { updateProject, getTeamMembers, getEvents } from "@/lib/database";
import type { Client, TeamMember, ProjectStatus, Priority, Project, Event } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

const projectFormSchema = z.object({
  eventId: z.string().min(1, "An event must be selected"),
  name: z.string().min(1, "Project name is required"),
  projectNumber: z.string().min(1, "Rental Works # is required"),
  clientId: z.string().min(1, "A client must be selected"),
  clientLocationId: z.string().min(1, "A client office must be selected."),
  location: z.string().min(1, "Location is required"),
  dates: z.object({
    prepTravelIn: z.date().optional(),
    prepTravelOut: z.date().optional(),
    showTravelIn: z.date().optional(),
    showTravelOut: z.date().optional(),
    loadIn: z.object({
      from: z.date({ required_error: "Load-in start date is required." }),
      to: z.date({ required_error: "Load-in end date is required." }),
    }),
    show: z.object({
        from: z.date({ required_error: "Show start date is required." }),
        to: z.date({ required_error: "Show end date is required." }),
    }),
    loadOut: z.object({
        from: z.date({ required_error: "Load-out start date is required." }),
        to: z.date({ required_error: "Load-out end date is required." }),
    }),
  }),
  status: z.custom<ProjectStatus>(val => ["Planning", "In Progress", "Completed", "On Hold", "Setup"].includes(val as string), {
      message: "Invalid project status"
  }),
  budget: z.coerce.number().min(0, "Budget must be a positive number"),
  priority: z.custom<Priority>(val => ["Critical", "High", "Medium", "Low"].includes(val as string), {
      message: "Invalid priority"
  }),
  assignedStaff: z.array(z.string()).optional(),
  probability: z.coerce.number().min(0).max(100),
  salesAgentId: z.string().min(1, "Sales agent is required"),
  warehouse: z.string().min(1, "Warehouse location is required"),
  services: z.array(z.string()).min(1, "At least one service must be selected"),
  description: z.string().optional(),
  finalBillingAmount: z.coerce.number().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectUpdated: () => Promise<void>;
  project: Project;
  clients: Client[];
}

const SingleDatePicker = ({ field, placeholder }: { field: any, placeholder: string }) => (
    <Popover>
        <PopoverTrigger asChild>
            <FormControl>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                    )}
                >
                    {field.value ? format(field.value, "PPP") : <span>{placeholder}</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
            />
        </PopoverContent>
    </Popover>
);

const RangeDatePicker = ({ field, placeholder }: { field: any, placeholder: string }) => (
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
                <span>{placeholder}</span>
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
);


export function EditProjectDialog({ isOpen, onOpenChange, onProjectUpdated, project, clients }: EditProjectDialogProps) {
  const { toast } = useToast();
  const [events, setEvents] = React.useState<Event[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [staffSearch, setStaffSearch] = React.useState("");

  const serviceOptions = ['Audio', 'Video', 'Lighting', 'Staging', 'Labor'];
  const warehouseOptions = ['Las Vegas', 'Los Angeles', 'New York', 'Orlando'];

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
  });

  const selectedClientId = form.watch("clientId");

  const selectedClient = React.useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [selectedClientId, clients]);
  
  React.useEffect(() => {
    if (isOpen && project) {
      const fetchData = async () => {
        const teamData = await getTeamMembers();
        setTeamMembers(teamData);
        const eventData = await getEvents();
        setEvents(eventData);
      };

      fetchData();
      setStaffSearch("");
      form.reset({
        ...project,
        budget: project.budget || 0,
        assignedStaff: project.assignedStaff || [],
        description: project.description || "",
        finalBillingAmount: project.finalBillingAmount || undefined,
        services: project.services || [],
      });
    }
  }, [isOpen, project, form]);


  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const spentBudget = project.spentBudget || 0;
      const finalMargin = data.finalBillingAmount != null && data.finalBillingAmount > 0
        ? ((data.finalBillingAmount - spentBudget) / data.finalBillingAmount) * 100
        : undefined;

      await updateProject({
        ...project,
        ...data,
        description: data.description || "",
        finalBillingAmount: data.finalBillingAmount,
        finalMargin: finalMargin,
      });

      toast({
        title: "Project Updated",
        description: `${data.name} has been successfully updated.`,
      });
      await onProjectUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the project. Please try again.",
      });
    }
  };

  const filteredStaff = teamMembers.filter(member => {
    const searchTerm = staffSearch.toLowerCase();
    return member.name.toLowerCase().includes(searchTerm) || member.role.toLowerCase().includes(searchTerm);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the details for {project.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Event</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Annual Tech Conference 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="projectNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rental Works # (RW)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., RW12345" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientLocationId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Client Office</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedClient}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={!selectedClient ? "Select a client first" : "Select an office"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {selectedClient?.locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="salesAgentId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sales Agent</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {teamMembers.map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Project Venue / Location</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Moscone Center, SF" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="warehouse"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Warehouse</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a warehouse" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {warehouseOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Provide a brief description of the project scope..."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />
                <h3 className="text-lg font-medium">Timeline</h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="dates.prepTravelIn" render={({ field }) => ( <FormItem><FormLabel>Prep Travel In</FormLabel><SingleDatePicker field={field} placeholder="Select Date" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.prepTravelOut" render={({ field }) => ( <FormItem><FormLabel>Prep Travel Out</FormLabel><SingleDatePicker field={field} placeholder="Select Date" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.showTravelIn" render={({ field }) => ( <FormItem><FormLabel>Show Travel In</FormLabel><SingleDatePicker field={field} placeholder="Select Date" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.showTravelOut" render={({ field }) => ( <FormItem><FormLabel>Show Travel Out</FormLabel><SingleDatePicker field={field} placeholder="Select Date" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.loadIn" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Load-in Dates</FormLabel><RangeDatePicker field={field} placeholder="Select load-in range" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.show" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Show Dates</FormLabel><RangeDatePicker field={field} placeholder="Select show date range" /><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dates.loadOut" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Load-out Dates</FormLabel><RangeDatePicker field={field} placeholder="Select load-out range" /><FormMessage /></FormItem> )} />
                </div>
                
                <Separator />
                <h3 className="text-lg font-medium">Financials & Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="finalBillingAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Final Billing Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 95000" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Set priority" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Planning">Planning</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Setup">Setup</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="probability"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Probability (%)</FormLabel>
                             <FormControl>
                                <Input type="number" min="0" max="100" placeholder="e.g., 90" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />
                <h3 className="text-lg font-medium">Services & Team</h3>

                 <FormField
                  control={form.control}
                  name="services"
                  render={() => (
                    <FormItem>
                      <FormLabel>Services</FormLabel>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                        {serviceOptions.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="services"
                            render={({ field }) => (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignedStaff"
                  render={() => (
                    <FormItem>
                      <FormLabel>Assign Staff</FormLabel>
                      <div className="relative my-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search staff by name or role..."
                          value={staffSearch}
                          onChange={(e) => setStaffSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="p-3 border rounded-md max-h-48 overflow-y-auto">
                        {filteredStaff.length > 0 ? (
                          filteredStaff.map((member) => (
                            <FormField
                              key={member.id}
                              control={form.control}
                              name="assignedStaff"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={member.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 py-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(member.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), member.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== member.id
                                                )
                                              );
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
                                );
                              }}
                            />
                          ))
                        ) : (
                          <p className="text-center text-sm text-muted-foreground py-4">No staff members found.</p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
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
