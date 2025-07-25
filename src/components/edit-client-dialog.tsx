
"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateClient, getClientTypes } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import type { Client, ClientLocation } from "@/lib/data";

const locationSchema = z.object({
  id: z.string().optional(), // Optional for new locations
  name: z.string().min(1, "Location name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

const clientFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  type: z.string().min(1, "A client type is required."),
  locations: z.array(locationSchema).min(1, "At least one location is required."),
  primaryLocationIndex: z.string().refine(val => !isNaN(parseInt(val, 10)), { message: "Primary location must be selected" }),
});


type ClientFormValues = z.infer<typeof clientFormSchema>;

const defaultLocationValues: Omit<ClientLocation, "id" | "isPrimary"> = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: { street: "", city: "", state: "", zip: "", country: "USA" },
};

interface EditClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientUpdated: () => Promise<void>;
  client: Client;
}

export function EditClientDialog({ isOpen, onOpenChange, onClientUpdated, client }: EditClientDialogProps) {
  const { toast } = useToast();
  const [clientTypes, setClientTypes] = React.useState<string[]>([]);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "locations",
  });
  
  const onSubmit = async (data: ClientFormValues) => {
    try {
      const primaryIndex = parseInt(data.primaryLocationIndex, 10);
      const updatedClientData: Client = {
        ...client,
        name: data.name,
        type: data.type,
        locations: data.locations.map((loc, index) => ({
            ...loc,
            id: loc.id || `loc-${Date.now()}-${index}`,
            isPrimary: index === primaryIndex,
        })),
      };
      
      await updateClient(updatedClientData);

      toast({
        title: "Client Updated",
        description: `${data.name} has been successfully updated.`,
      });
      await onClientUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the client. Please try again.",
      });
    }
  };

  React.useEffect(() => {
    if (isOpen) {
        getClientTypes().then(allTypes => {
            if (client.type && !allTypes.includes(client.type)) {
                allTypes.unshift(client.type);
            }
            setClientTypes(allTypes);
        });

        form.reset({
            name: client.name,
            type: client.type,
            locations: client.locations.map(({isPrimary, ...loc}) => loc),
            primaryLocationIndex: String(client.locations.findIndex(l => l.isPrimary)),
        });
    }
  }, [isOpen, client, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the details for {client.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Starlight Events" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-2">
                <h3 className="text-lg font-medium">Locations</h3>
                 <Controller
                    control={form.control}
                    name="primaryLocationIndex"
                    render={({ field }) => (
                        <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="w-full"
                        >
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                            {fields.map((fieldItem, index) => (
                              <div key={fieldItem.id} className="p-4 border rounded-lg relative">
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                     <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={String(index)} id={`primary-edit-${index}`} />
                                        </FormControl>
                                        <FormLabel htmlFor={`primary-edit-${index}`} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                                            <Star className={cn("h-4 w-4", form.watch('primaryLocationIndex') == String(index) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                                            Primary
                                        </FormLabel>
                                    </FormItem>
                                  {fields.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => remove(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField name={`locations.${index}.name`} render={({field}) => <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Headquarters" {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.contactPerson`} render={({field}) => <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g., Jan Levinson" {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.email`} render={({field}) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g., contact@company.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.phone`} render={({field}) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., (555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.address.street`} render={({field}) => <FormItem className="md:col-span-2"><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="e.g., 123 Main St" {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.address.city`} render={({field}) => <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.address.state`} render={({field}) => <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.address.zip`} render={({field}) => <FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                  <FormField name={`locations.${index}.address.country`} render={({field}) => <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                </div>
                              </div>
                            ))}
                            </div>
                           </ScrollArea>
                        </RadioGroup>
                    )}
                 />
                <FormMessage>{form.formState.errors.locations?.root?.message}</FormMessage>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append(defaultLocationValues)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Another Location
            </Button>
            
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
