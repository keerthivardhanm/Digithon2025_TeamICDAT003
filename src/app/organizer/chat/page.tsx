'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { User as AppUser, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TeamChatPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const adminsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'admin'));
  }, [firestore]);
  const { data: admins, loading: adminsLoading } = useCollection<AppUser>(adminsQuery);

  const selectedAdminDoc = useMemo(() => {
    if (!firestore || !selectedAdminId) return null;
    return doc(firestore, 'users', selectedAdminId);
  }, [firestore, selectedAdminId]);
  const { data: selectedAdmin } = useDoc<AppUser>(selectedAdminDoc);

  const messagesQuery = useMemo(() => {
    if (!firestore || !authUser || !selectedAdminId) return null;
    const chatId = [authUser.uid, selectedAdminId].sort().join('_');
    return query(collection(firestore, `messages/${chatId}/chats`), orderBy('timestamp', 'asc'));
  }, [firestore, authUser, selectedAdminId]);
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to the bottom. A better solution might use a library.
        setTimeout(() => {
             if (scrollAreaRef.current) {
                const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
                if(viewport) viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !firestore || !authUser || !selectedAdminId) return;

    const chatId = [authUser.uid, selectedAdminId].sort().join('_');
    const messagesCollection = collection(firestore, `messages/${chatId}/chats`);
    
    await addDoc(messagesCollection, {
      text: message,
      senderId: authUser.uid,
      receiverIds: [selectedAdminId],
      timestamp: serverTimestamp(),
      read: false,
    });

    setMessage('');
  };
  
  const handleSelectAdmin = (adminId: string) => {
    setSelectedAdminId(adminId);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="w-1/3 border-r">
        <Card className="rounded-none border-0 border-b">
          <CardHeader>
            <CardTitle>Team Chat</CardTitle>
          </CardHeader>
        </Card>
        <ScrollArea className="h-full">
            {adminsLoading ? <p className="p-4">Loading admins...</p> : admins.map(admin => (
                <button key={admin.id} onClick={() => handleSelectAdmin(admin.id)} className={`w-full text-left p-4 border-b flex items-center gap-3 hover:bg-muted ${selectedAdminId === admin.id ? 'bg-muted' : ''}`}>
                    <Avatar>
                        <AvatarImage src={admin.avatar} />
                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{admin.name}</p>
                        <p className="text-sm text-muted-foreground">{admin.role}</p>
                    </div>
                </button>
            ))}
        </ScrollArea>
      </aside>
      <main className="w-2/3 flex flex-col">
        {!selectedAdmin ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select an admin to start chatting.</p>
            </div>
        ) : (
            <>
                <header className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={selectedAdmin.avatar} />
                        <AvatarFallback>{selectedAdmin.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-semibold">{selectedAdmin.name}</h2>
                </header>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messagesLoading ? <p>Loading messages...</p> : messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.senderId === authUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-xs mt-1 ${msg.senderId === authUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp.toDate()), { addSuffix: true }) : 'sending...'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                    <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." autoComplete="off" />
                    <Button type="submit" size="icon" disabled={!message.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </>
        )}
      </main>
    </div>
  );
}
