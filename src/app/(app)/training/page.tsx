
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, CalendarOff, Clock, Users, CalendarPlus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTrainingSessions, getPtoRequests, getTeamMembers, deleteTrainingSession, deletePtoRequest } from "@/lib/database";
import type { TrainingSession, PtoRequest, TeamMember } from "@/lib/data";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScheduleTrainingDialog } from "@/components/schedule-training-dialog";
import { SchedulePtoDialog } from "@/components/schedule-pto-dialog";
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
import { EditTrainingSessionDialog } from "@/components/edit-training-session-dialog";
import { EditPtoRequestDialog } from "@/components/edit-pto-request-dialog";


export default function TrainingPage() {
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [ptoRequests, setPtoRequests] = useState<PtoRequest[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
    const [isPtoDialogOpen, setIsPtoDialogOpen] = useState(false);
    const [trainingToEdit, setTrainingToEdit] = useState<TrainingSession | null>(null);
    const [ptoToEdit, setPtoToEdit] = useState<PtoRequest | null>(null);
    const [trainingToDelete, setTrainingToDelete] = useState<TrainingSession | null>(null);
    const [ptoToDelete, setPtoToDelete] = useState<PtoRequest | null>(null);
    const { toast } = useToast();

    const refreshData = async () => {
        setLoading(true);
        const [trainingData, ptoData, teamData] = await Promise.all([
            getTrainingSessions(),
            getPtoRequests(),
            getTeamMembers()
        ]);
        setTrainingSessions(trainingData);
        setPtoRequests(ptoData);
        setTeamMembers(teamData);
        setLoading(false);
    }
    
    useEffect(() => {
        refreshData();
    }, []);

    const getMember = (id: string) => teamMembers.find(m => m.id === id);

    const handleDeleteTraining = async () => {
        if (!trainingToDelete) return;
        try {
            await deleteTrainingSession(trainingToDelete.id);
            toast({ title: "Training Deleted", description: "The training session has been removed." });
            await refreshData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete training session." });
        } finally {
            setTrainingToDelete(null);
        }
    };
    
    const handleDeletePto = async () => {
        if (!ptoToDelete) return;
        try {
            await deletePtoRequest(ptoToDelete.id);
            toast({ title: "PTO Deleted", description: "The PTO request has been removed." });
            await refreshData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete PTO request." });
        } finally {
            setPtoToDelete(null);
        }
    };

    if (loading) {
        return (
             <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-5 w-80 mt-2" />
                    </div>
                     <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-44" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
                 <div className="grid lg:grid-cols-2 gap-6 items-start">
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Training & PTO</h1>
                        <p className="text-muted-foreground">
                            Manage team training schedules and paid time off.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsTrainingDialogOpen(true)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Schedule Training
                        </Button>
                        <Button variant="outline" onClick={() => setIsPtoDialogOpen(true)}>
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Schedule PTO
                        </Button>
                    </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-6 items-start">
                    {/* Training Sessions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen />Upcoming Training</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trainingSessions.length > 0 ? trainingSessions.map(session => (
                                <div key={session.id} className="p-4 border rounded-lg space-y-3 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setTrainingToEdit(session)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setTrainingToDelete(session)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <h3 className="font-semibold pr-8">{session.courseName}</h3>
                                    <p className="text-sm text-muted-foreground">{session.description}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground"/>
                                            <span>{format(session.dates.from, 'MMM d')} - {format(session.dates.to, 'MMM d, yyyy')}</span>
                                        </div>
                                        <Badge variant="secondary">{session.status}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {session.attendees.map(id => {
                                                const member = getMember(id);
                                                return member ? (
                                                    <Avatar key={id} className="h-6 w-6 border-2 border-card">
                                                        <AvatarImage src={member.avatarUrl} data-ai-hint="person face" />
                                                        <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                                    </Avatar>
                                                ) : null
                                            })}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {session.attendees.length} attendee{session.attendees.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No upcoming training sessions.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* PTO Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarOff />Paid Time Off</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ptoRequests.length > 0 ? ptoRequests.map(request => {
                                const member = getMember(request.teamMemberId);
                                return member ? (
                                    <div key={request.id} className="p-4 border rounded-lg space-y-3 relative group">
                                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setPtoToEdit(request)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPtoToDelete(request)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex items-center gap-3 pr-8">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.avatarUrl} data-ai-hint="person face" />
                                                <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold">{member.name}</h3>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground"/>
                                                <span>{format(request.dates.from, 'MMM d')} - {format(request.dates.to, 'MMM d, yyyy')}</span>
                                            </div>
                                            <Badge variant={request.type === 'Vacation' ? 'default' : 'secondary'}>{request.type}</Badge>
                                        </div>
                                    </div>
                                ) : null
                            }) : (
                                <p className="text-center text-muted-foreground py-8">No upcoming PTO requests.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <ScheduleTrainingDialog 
                isOpen={isTrainingDialogOpen}
                onOpenChange={setIsTrainingDialogOpen}
                onTrainingScheduled={refreshData}
                teamMembers={teamMembers}
            />
            {trainingToEdit && (
                <EditTrainingSessionDialog
                    isOpen={!!trainingToEdit}
                    onOpenChange={(isOpen) => !isOpen && setTrainingToEdit(null)}
                    onTrainingUpdated={async () => {
                        await refreshData();
                        setTrainingToEdit(null);
                    }}
                    teamMembers={teamMembers}
                    session={trainingToEdit}
                />
            )}
            <SchedulePtoDialog
                isOpen={isPtoDialogOpen}
                onOpenChange={setIsPtoDialogOpen}
                onPtoScheduled={refreshData}
                teamMembers={teamMembers}
            />
            {ptoToEdit && (
                 <EditPtoRequestDialog
                    isOpen={!!ptoToEdit}
                    onOpenChange={(isOpen) => !isOpen && setPtoToEdit(null)}
                    onPtoUpdated={async () => {
                        await refreshData();
                        setPtoToEdit(null);
                    }}
                    teamMembers={teamMembers}
                    request={ptoToEdit}
                />
            )}
            <AlertDialog open={!!trainingToDelete} onOpenChange={(isOpen) => !isOpen && setTrainingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the training session: <span className="font-semibold">{trainingToDelete?.courseName}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTraining}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!ptoToDelete} onOpenChange={(isOpen) => !isOpen && setPtoToDelete(null)}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete this PTO request for <span className="font-semibold">{getMember(ptoToDelete?.teamMemberId || '')?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePto}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    