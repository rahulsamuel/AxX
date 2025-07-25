
"use client";

import { useState, useEffect } from "react";
import { getClients, deleteClient, getProjects, getTeamMembers } from "@/lib/database";
import type { Client, Project, TeamMember } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MoreVertical, Plus, Trash2, Edit, Search, Briefcase, User } from "lucide-react";
import { AddClientDialog } from "@/components/add-client-dialog";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { ViewClientProjectsDialog } from "@/components/view-client-projects-dialog";
import { ViewClientDetailsDialog } from "@/components/view-client-details-dialog";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";


const getClientTypeBadgeClass = (type: Client['type']) => {
  switch (type) {
    case "Event Organizer":
      return "bg-blue-100 text-blue-800";
    case "Exhibit Company":
      return "bg-purple-100 text-purple-800";
    case "Movie Production":
      return "bg-green-100 text-green-800";
    case "Live Music Promoter":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [clientToViewDetails, setClientToViewDetails] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [clientsData, projectData, teamMembersData] = await Promise.all([
            getClients(),
            getProjects(),
            getTeamMembers()
        ]);
        setClients(clientsData);
        setProjects(projectData);
        setTeamMembers(teamMembersData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const refreshClients = async () => {
    const clientsData = await getClients();
    setClients(clientsData);
  }

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    if (client.name.toLowerCase().includes(searchLower)) return true;
    if (client.type?.toLowerCase().includes(searchLower)) return true;

    if (client.locations?.some(location => 
        location.contactPerson?.toLowerCase().includes(searchLower) ||
        location.email?.toLowerCase().includes(searchLower) ||
        location.phone?.toLowerCase().includes(searchLower) ||
        location.name?.toLowerCase().includes(searchLower)
    )) {
        return true;
    }
    
    return false;
  });

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      toast({
        title: "Client Deleted",
        description: `${clientToDelete.name} has been successfully deleted.`,
      });
      await refreshClients();
      setClientToDelete(null);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the client. Please try again.",
      });
    }
  };


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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client relationships and project history.
            </p>
          </div>
          <Button onClick={() => setIsAddClientDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </div>
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b">
            <CardTitle className="text-lg font-semibold">Client Directory ({filteredClients.length})</CardTitle>
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search clients..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead className="text-right">Total Contribution</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const primaryLocation = client.locations?.find(l => l.isPrimary) || client.locations?.[0];
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        {client.type ? (
                            <Badge variant="secondary" className={getClientTypeBadgeClass(client.type)}>
                                {client.type}
                            </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{primaryLocation?.contactPerson || 'N/A'}</TableCell>
                      <TableCell>{primaryLocation?.email || 'N/A'}</TableCell>
                      <TableCell>{primaryLocation?.phone || 'N/A'}</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                             <Building className="h-4 w-4 text-muted-foreground" />
                             <span>{client.locations?.length || 0}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(client.totalContribution || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setClientToViewDetails(client)}>
                                    <User className="mr-2 h-4 w-4" /> View Client
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setClientToView(client)}>
                                    <Briefcase className="mr-2 h-4 w-4" /> View Projects
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setClientToEdit(client)}><Edit className="mr-2 h-4 w-4" /> Edit Client</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setClientToDelete(client)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end">
              <p className="text-sm text-muted-foreground">
                  Showing {filteredClients.length} of {clients.length} clients.
              </p>
          </CardFooter>
        </Card>
      </div>
      <AddClientDialog
        isOpen={isAddClientDialogOpen}
        onOpenChange={setIsAddClientDialogOpen}
        onClientAdded={refreshClients}
      />
      {clientToEdit && (
        <EditClientDialog
          client={clientToEdit}
          isOpen={!!clientToEdit}
          onOpenChange={(isOpen) => !isOpen && setClientToEdit(null)}
          onClientUpdated={async () => {
            await refreshClients();
            setClientToEdit(null);
          }}
        />
      )}
      {clientToView && (
        <ViewClientProjectsDialog
          client={clientToView}
          projects={projects}
          teamMembers={teamMembers}
          isOpen={!!clientToView}
          onOpenChange={(isOpen) => !isOpen && setClientToView(null)}
        />
      )}
      {clientToViewDetails && (
        <ViewClientDetailsDialog
            client={clientToViewDetails}
            projects={projects}
            isOpen={!!clientToViewDetails}
            onOpenChange={(isOpen) => !isOpen && setClientToViewDetails(null)}
        />
      )}
      <AlertDialog open={!!clientToDelete} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client{' '}
              <span className="font-semibold">{clientToDelete?.name}</span> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
