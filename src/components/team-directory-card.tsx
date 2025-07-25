
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "./ui/card";
import type { TeamMember } from "@/lib/data";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { BookOpen, Briefcase, CalendarOff, Edit, Eye, MoreHorizontal, Trash2, UserPlus } from "lucide-react";

interface TeamDirectoryCardProps {
  members: TeamMember[];
  selectedMemberIds: string[];
  onSelectionChange: (memberId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  onViewDetails: (member: TeamMember) => void;
  onViewProjects: (member: TeamMember) => void;
  onAssignProjects: (member: TeamMember) => void;
  onAssignTraining: (member: TeamMember) => void;
  onAssignPto: (member: TeamMember) => void;
}

export function TeamDirectoryCard({
  members,
  selectedMemberIds,
  onSelectionChange,
  onSelectAll,
  onEdit,
  onDelete,
  onViewDetails,
  onViewProjects,
  onAssignProjects,
  onAssignTraining,
  onAssignPto,
}: TeamDirectoryCardProps) {
  const isAllSelected =
    members.length > 0 && selectedMemberIds.length === members.length;
  const isSomeSelected =
    selectedMemberIds.length > 0 &&
    selectedMemberIds.length < members.length;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isSomeSelected ? "indeterminate" : isAllSelected}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.id}
                data-state={
                  selectedMemberIds.includes(member.id) ? "selected" : ""
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedMemberIds.includes(member.id)}
                    onCheckedChange={() => onSelectionChange(member.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.avatarUrl}
                        alt={member.name}
                        data-ai-hint="person face"
                      />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.department}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(member)}>
                        <Eye className="mr-2 h-4 w-4" /> View Team Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewProjects(member)}>
                        <Briefcase className="mr-2 h-4 w-4" /> View Projects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAssignProjects(member)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Assign to Projects
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssignTraining(member)}>
                        <BookOpen className="mr-2 h-4 w-4" /> Assign Training
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssignPto(member)}>
                        <CalendarOff className="mr-2 h-4 w-4" /> Assign PTO
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(member)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(member)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
