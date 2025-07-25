
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user, loading, setUser } = useAuth(); // Get setUser from useAuth
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName });

            // Update Firestore teamMember document
            const teamMemberRef = doc(db, "teamMembers", user.uid);
            const teamMemberSnap = await getDoc(teamMemberRef);

            if (teamMemberSnap.exists()) {
                await updateDoc(teamMemberRef, { name: displayName });
            } else {
                // This will create the document if it doesn't exist, which is good for existing users.
                await setDoc(teamMemberRef, { 
                    name: displayName,
                    email: user.email,
                    role: 'Team Member', // Default role
                    department: 'Unassigned', // Default department
                 }, { merge: true });
            }
            
            // Optimistically update local user state
            setUser({...user, displayName});

            toast({
                title: "Profile Updated",
                description: "Your display name has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update your profile. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user || !storage) {
            return;
        }

        const file = event.target.files[0];
        setIsUploading(true);

        try {
            const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update Firebase Auth
            await updateProfile(user, { photoURL: downloadURL });
            
            // Update Firestore
            const teamMemberRef = doc(db, "teamMembers", user.uid);
            await updateDoc(teamMemberRef, { avatarUrl: downloadURL });

            // Optimistically update local user state
            setUser({...user, photoURL: downloadURL});

            toast({
                title: "Photo Updated",
                description: "Your profile photo has been successfully updated.",
            });

        } catch (error) {
            console.error("Error uploading photo:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "There was a problem uploading your photo. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };


    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <p>Please log in to view your profile.</p>;
    }

    const getAvatarFallback = () => {
        const name = displayName || user.displayName || "";
        if (name) {
            return name.split(' ').map(n => n[0]).join('');
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">
                    Manage your profile and account settings.
                </p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-2">
                                <AvatarImage src={user.photoURL || "https://placehold.co/96x96.png"} alt="User" data-ai-hint="person avatar" />
                                <AvatarFallback className="text-3xl">{getAvatarFallback()}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{displayName || user.displayName}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                                disabled={isUploading}
                            />
                             <Button 
                                className="w-full" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                             >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : "Upload New Photo"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input 
                                        id="displayName" 
                                        value={displayName} 
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" defaultValue={user.email || ""} disabled />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
