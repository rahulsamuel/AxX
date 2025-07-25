
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import type { TeamMember } from "@/lib/data";

interface ViewTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: TeamMember;
}

export function ViewTeamMemberDialog({
  isOpen,
  onOpenChange,
  member,
}: ViewTeamMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center pt-4">
          <Avatar className="h-24 w-24 mb-2">
            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
            <AvatarFallback className="text-3xl">
              {member.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl">{member.name}</DialogTitle>
          <DialogDescription>
            {member.role}
          </DialogDescription>
           <Badge variant="secondary" className="mt-2">{member.department}</Badge>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <a href={`mailto:${member.email}`} className="text-sm hover:underline">{member.email}</a>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">{member.phone}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
