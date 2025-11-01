'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';
import type { Alert } from '@/lib/types';
import Link from 'next/link';

export default function RaiseTicketPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [priority, setPriority] = useState<Alert['priority']>('Medium');
  const [zoneId, setZoneId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !authUser || !priority || !zoneId || !message) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
      return;
    }
    setIsSubmitting(true);

    const newAlert: Omit<Alert, 'id'> = {
      type: 'manual',
      zoneId,
      eventId: 'active-event-id', // This should be dynamic
      message,
      priority,
      senderId: authUser.uid,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(firestore, 'alerts'), newAlert);
      toast({ title: 'Ticket Raised Successfully', description: 'The admin team has been notified.' });
      router.push('/organizer');
    } catch (error) {
      console.error('Error raising ticket: ', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not raise the ticket. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link href="/organizer">
                <ArrowLeft />
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">Raise a New Ticket</h1>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>New Support Ticket</CardTitle>
            <CardDescription>Fill in the details below. This will be sent to the event administrators.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select onValueChange={(v) => setPriority(v as Alert['priority'])} defaultValue="Medium">
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zoneId">Zone ID</Label>
                <Input
                  id="zoneId"
                  placeholder="e.g., A-3, Main Stage"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the issue or request in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : <><Send className="mr-2 h-4 w-4" /> Submit Ticket</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
