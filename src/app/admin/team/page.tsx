'use client';

import React, { useState } from 'react';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createNewUser } from '@/firebase/auth';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function TeamPage() {
    useAuthGuard('admin');
    const firestore = useFirestore();
    const { data: users, loading } = useCollection<User>(firestore ? collection(firestore, 'users') : null);
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAddNewUser = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    };

    const handleDeleteUser = async (uid: string) => {
        if(confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            if (!firestore) return;
            try {
                await deleteDoc(doc(firestore, 'users', uid));
                // Note: This only deletes the user from the Firestore collection.
                // You would need a Firebase Function to delete the user from Firebase Auth.
                toast({ title: "User deleted successfully" });
            } catch (error) {
                console.error("Error deleting user: ", error);
                toast({ variant: 'destructive', title: "Error deleting user", description: "See console for details." });
            }
        }
    };
    
    const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore) return;

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const role = formData.get('role') as User['role'];
        const password = formData.get('password') as string;
        const assignedZones = (formData.get('assignedZones') as string).split(',').map(s => s.trim()).filter(Boolean);
        
        try {
            if (editingUser) {
                // Update existing user document in Firestore
                const userRef = doc(firestore, 'users', editingUser.id);
                await setDoc(userRef, { name, email, role, assignedZones }, { merge: true });
                toast({ title: "User updated successfully" });
            } else {
                // Create new user in Firebase Auth and Firestore
                if (!password) {
                    toast({ variant: 'destructive', title: 'Password is required for new users' });
                    return;
                }
                const authUser = await createNewUser(email, password);
                if (authUser) {
                    const userRef = doc(firestore, 'users', authUser.uid);
                    await setDoc(userRef, {
                        id: authUser.uid,
                        uid: authUser.uid,
                        name,
                        email,
                        role,
                        assignedZones,
                        avatar: `https://i.pravatar.cc/150?u=${authUser.uid}`
                    });
                    toast({ title: "User created successfully" });
                }
            }
            setIsDialogOpen(false);
            setEditingUser(null);
        } catch (error: any) {
            console.error("Error saving user:", error);
            toast({ variant: 'destructive', title: 'Error saving user', description: error.message });
        }
    };

  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                         <CardTitle>Team Management</CardTitle>
                        <CardDescription>
                            Add, edit, and manage organizers and volunteers.
                        </CardDescription>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button size="sm" className="h-8 gap-1" onClick={handleAddNewUser}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add User
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Avatar</span>
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden md:table-cell">Assigned Zones</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {loading ? (
                             <TableRow>
                               <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                             </TableRow>
                           ) : (
                             users.map(user => (
                             <TableRow key={user.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <UserIcon className="h-10 w-10 text-muted-foreground rounded-full bg-muted p-2" />
                                </TableCell>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : (user.role === 'organizer' ? 'secondary' : 'outline')}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {user.assignedZones?.join(', ') || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                           )))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{users.length}</strong> of <strong>{users.length}</strong> users
                    </div>
                </CardFooter>
            </Card>
        </main>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <form onSubmit={handleSaveUser}>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details below. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={editingUser?.name || ''} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={editingUser?.email || ''} className="col-span-3" required disabled={!!editingUser} />
                        </div>
                        {!editingUser && (
                           <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">Password</Label>
                                <Input id="password" name="password" type="password" className="col-span-3" required />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select name="role" defaultValue={editingUser?.role || 'volunteer'}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="organizer">Organizer</SelectItem>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="audience">Audience</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="assignedZones" className="text-right">Zones</Label>
                            <Input id="assignedZones" name="assignedZones" defaultValue={editingUser?.assignedZones?.join(',') || ''} className="col-span-3" placeholder="Comma-separated zone IDs"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
