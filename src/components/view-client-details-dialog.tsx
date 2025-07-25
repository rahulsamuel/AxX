
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Client, Project } from "@/lib/data";
import { Building, Mail, Phone, MapPin, Star, DollarSign, Briefcase } from "lucide-react";

interface ViewClientDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client;
  projects: Project[];
}

const getClientTypeBadgeClass = (type: Client['type']) => {
  switch (type) {
    case "Automotive":
      return "bg-blue-100 text-blue-800";
    case "Tech":
      return "bg-purple-100 text-purple-800";
    case "Corporate":
      return "bg-green-100 text-green-800";
    case "Entertainment":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};


export function ViewClientDetailsDialog({
  isOpen,
  onOpenChange,
  client,
  projects,
}: ViewClientDetailsDialogProps) {
  const clientProjects = projects.filter((p) => p.clientId === client.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-2xl">{client.name}</DialogTitle>
          <DialogDescription>
            <Badge variant="secondary" className={cn(getClientTypeBadgeClass(client.type))}>
              {client.type}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6 -mr-6">
            <div className="py-4 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/30 flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <DollarSign className="h-6 w-6 text-primary"/>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Contribution</p>
                            <p className="text-2xl font-bold">${(client.totalContribution || 0).toLocaleString()}</p>
                        </div>
                    </div>
                     <div className="p-4 rounded-lg border bg-muted/30 flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Briefcase className="h-6 w-6 text-primary"/>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Projects</p>
                            <p className="text-2xl font-bold">{clientProjects.length}</p>
                        </div>
                    </div>
                     <div className="p-4 rounded-lg border bg-muted/30 flex items-start gap-4">
                         <div className="p-2 bg-primary/10 rounded-md">
                            <Building className="h-6 w-6 text-primary"/>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Locations</p>
                            <p className="text-2xl font-bold">{client.locations?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <Separator />
              
                <div>
                    <h3 className="text-lg font-semibold mb-4">Locations & Contacts</h3>
                    {client.locations && client.locations.length > 0 ? (
                        <div className="space-y-4">
                            {client.locations.map((location) => (
                                <div key={location.id} className={cn("p-4 border rounded-lg", location.isPrimary && "border-primary/50 bg-primary/5")}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-base">{location.name}</h4>
                                        {location.isPrimary && (
                                            <Badge variant="default">
                                                <Star className="mr-2 h-4 w-4" /> Primary
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium mt-2 mb-3">{location.contactPerson}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a href={`mailto:${location.email}`} className="hover:underline">{location.email}</a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{location.phone}</span>
                                        </div>
                                        <div className="flex items-start gap-2 col-span-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span>
                                                {location.address.street}, {location.address.city}, {location.address.state} {location.address.zip}, {location.address.country}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg border-dashed">
                            <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold">No Locations Found</h3>
                            <p className="text-muted-foreground">This client does not have any locations in the system yet.</p>
                        </div>
                    )}
                </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
