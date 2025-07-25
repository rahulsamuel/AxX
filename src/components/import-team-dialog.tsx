
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addTeamMember } from "@/lib/database";
import type { TeamMember } from "@/lib/data";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ImportTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: File;
  onImportComplete: () => Promise<void>;
}

type NewTeamMember = Omit<TeamMember, "id">;

export function ImportTeamDialog({
  isOpen,
  onOpenChange,
  file,
  onImportComplete,
}: ImportTeamDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<NewTeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      Papa.parse<NewTeamMember>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
          } else {
            // Basic validation
            const requiredFields = ["name", "role", "department", "email", "phone"];
            const headers = results.meta.fields || [];
            const missingHeaders = requiredFields.filter(h => !headers.includes(h));

            if (missingHeaders.length > 0) {
                setError(`CSV file is missing required columns: ${missingHeaders.join(', ')}.`);
                return;
            }
            
            setParsedData(results.data);
            setError(null);
          }
        },
      });
    }
  }, [file]);

  const handleImport = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
        for (const member of parsedData) {
            await addTeamMember(member);
        }

        toast({
            title: "Import Successful",
            description: `${parsedData.length} team members have been imported.`,
        });
        await onImportComplete();
    } catch (err) {
        console.error("Import error:", err);
        setError("An unexpected error occurred during import. Please check the data and try again.");
        toast({
            variant: "destructive",
            title: "Import Failed",
            description: "Could not import team members.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Team Members</DialogTitle>
          <DialogDescription>
            Review the members to be imported from {file.name}.
          </DialogDescription>
        </DialogHeader>

        {error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
            <div className="py-4">
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Ready to Import</AlertTitle>
                    <AlertDescription>
                        Found {parsedData.length} team members to import.
                    </AlertDescription>
                </Alert>
                <ScrollArea className="h-64 mt-4 border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.role}</TableCell>
                                    <TableCell>{member.department}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        )}
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isSubmitting || !!error || parsedData.length === 0}>
            {isSubmitting ? "Importing..." : "Confirm Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    