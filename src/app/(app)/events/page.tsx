
"use client";

import { useState, useEffect } from "react";
import { getEvents, deleteEvent, getProjects, getTeamMembers, getClients } from "@/lib/database";
import type { Event, Project, TeamMember, Client } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ExternalLink, MoreHorizontal, Briefcase, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddEventDialog } from "@/components/add-event-dialog";
import { EditEventDialog } from "@/components/edit-event-dialog";
import { ViewEventProjectsDialog } from "@/components/view-event-projects-dialog";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToView, setEventToView] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const refreshData = async () => {
    setLoading(true);
    const [eventsData, projectsData, teamMembersData, clientsData] = await Promise.all([
      getEvents(),
      getProjects(),
      getTeamMembers(),
      getClients()
    ]);
    setEvents(eventsData);
    setProjects(projectsData);
    setTeamMembers(teamMembersData);
    setClients(clientsData);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id);
      toast({
        title: "Event Deleted",
        description: `${eventToDelete.name} has been successfully deleted.`,
      });
      await refreshData();
      setEventToDelete(null);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the event. Please try again.",
      });
    }
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return event.name?.toLowerCase().includes(searchLower) || 
           (event.location && event.location.toLowerCase().includes(searchLower)) ||
           (event.acronym && event.acronym.toLowerCase().includes(searchLower)) ||
           (event.eventType && event.eventType.toLowerCase().includes(searchLower));
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">
              Browse and manage all your high-level events and shows.
            </p>
          </div>
          <Button onClick={() => setIsAddEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search events, acronyms, types..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Projects</TableHead>
                            <TableHead>Entered By</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map((event) => {
                                const projectCount = projects.filter(p => p.eventId === event.id).length;
                                return (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        {event.showWebsite ? (
                                            <a href={event.showWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                                                {event.name}
                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            </a>
                                        ) : (
                                            <span>{event.name}</span>
                                        )}
                                        <div className="text-sm text-muted-foreground">{event.acronym}</div>
                                    </TableCell>
                                    <TableCell>{event.eventType}</TableCell>
                                    <TableCell>{event.location}</TableCell>
                                    <TableCell>{format(event.dates.from, 'MMM d, yyyy')} - {format(event.dates.to, 'MMM d, yyyy')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            <span>{projectCount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{event.enteredBy}</TableCell>
                                    <TableCell className="text-right">
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                 <DropdownMenuItem onClick={() => setEventToView(event)}>
                                                    <Briefcase className="mr-2 h-4 w-4" /> View Projects
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEventToEdit(event)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Event
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setEventToDelete(event)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {searchTerm ? `No results for "${searchTerm}"` : "No events found. Click 'New Event' to add one."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {filteredEvents.length > 0 && (
                <CardFooter className="justify-end p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredEvents.length} of {events.length} events.
                    </p>
                </CardFooter>
            )}
        </Card>

      </div>
      <AddEventDialog
        isOpen={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
        onEventAdded={refreshData}
      />
      {eventToEdit && (
        <EditEventDialog
            event={eventToEdit}
            isOpen={!!eventToEdit}
            onOpenChange={(isOpen) => !isOpen && setEventToEdit(null)}
            onEventUpdated={async () => {
                await refreshData();
                setEventToEdit(null);
            }}
        />
      )}
      {eventToView && (
        <ViewEventProjectsDialog
          event={eventToView}
          projects={projects}
          teamMembers={teamMembers}
          clients={clients}
          isOpen={!!eventToView}
          onOpenChange={(isOpen) => !isOpen && setEventToView(null)}
        />
      )}
      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event{' '}
                <span className="font-semibold">{eventToDelete?.name}</span>. Associated projects will not be deleted.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
