
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { DashboardWidget, WidgetId } from "@/app/(app)/dashboard/page";
import { Label } from "./ui/label";

interface AddWidgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allWidgets: DashboardWidget[];
  visibleWidgets: Record<WidgetId, boolean>;
  onWidgetsChange: (newWidgets: Record<WidgetId, boolean>) => void;
}

export function AddWidgetDialog({ 
    isOpen, 
    onOpenChange, 
    allWidgets,
    visibleWidgets,
    onWidgetsChange 
}: AddWidgetDialogProps) {
    const { toast } = useToast();
    const [selectedWidgets, setSelectedWidgets] = useState(visibleWidgets);

    useEffect(() => {
        if (isOpen) {
            setSelectedWidgets(visibleWidgets);
        }
    }, [isOpen, visibleWidgets]);

    const handleCheckboxChange = (widgetId: WidgetId, checked: boolean) => {
        setSelectedWidgets(prev => ({
            ...prev,
            [widgetId]: checked
        }));
    };

    const handleSubmit = () => {
        onWidgetsChange(selectedWidgets);
        toast({ 
            title: "Dashboard Updated",
            description: "Your widget layout has been saved." 
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Widgets to Dashboard</DialogTitle>
                    <DialogDescription>
                        Select the widgets you want to display on your dashboard.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <ScrollArea className="h-72 border rounded-md p-4">
                        <div className="space-y-4">
                            {allWidgets.map((widget) => (
                                <div key={widget.id} className="flex items-start space-x-3 rounded-md p-3 hover:bg-muted/50">
                                    <Checkbox
                                        id={`widget-${widget.id}`}
                                        checked={selectedWidgets[widget.id]}
                                        onCheckedChange={(checked) => handleCheckboxChange(widget.id, !!checked)}
                                        className="mt-1"
                                    />
                                    <Label htmlFor={`widget-${widget.id}`} className="font-normal w-full cursor-pointer">
                                        <div className="font-medium">{widget.name}</div>
                                        <div className="text-sm text-muted-foreground">{widget.description}</div>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
