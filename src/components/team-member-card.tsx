
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/lib/data";
import { Mail, Phone } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

interface TeamMemberCardProps {
  member: TeamMember;
  isSelected: boolean;
  onSelectionChange: (memberId: string) => void;
}

export function TeamMemberCard({ member, isSelected, onSelectionChange }: TeamMemberCardProps) {
  return (
    <Card className="flex flex-col relative">
      <div className="absolute top-3 right-3">
        <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectionChange(member.id)}
        />
      </div>
      <CardHeader className="flex flex-col items-center text-center p-4 pb-2">
        <Avatar className="h-20 w-20 mb-2">
          <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
          <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-bold">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.role}</p>
        <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{member.department}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
            </div>
            <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{member.phone}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
