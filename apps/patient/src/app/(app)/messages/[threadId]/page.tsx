'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from '@/components/messages/message-bubble';
import { usePatientThread, useSendPatientMessage, useMarkMessageRead } from '@/lib/hooks/use-patient-messages';
import { usePatientAuth } from '@/providers/patient-auth-provider';

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { patient } = usePatientAuth();
  const { data: thread, isLoading } = usePatientThread(threadId);
  const sendMessage = useSendPatientMessage();
  const markRead = useMarkMessageRead();

  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // Mark unread doctor messages as read
  useEffect(() => {
    if (thread?.messages && patient) {
      const unread = thread.messages.filter(
        (m) => m.senderType !== 'PATIENT' && !m.readAt,
      );
      unread.forEach((m) => markRead.mutate(m.id));
    }
  }, [thread?.messages, patient]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await sendMessage.mutateAsync({ threadId, content: content.trim() });
    setContent('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-2/3 ml-auto" />
      </div>
    );
  }

  if (!thread) return <p className="text-gray-500">Thread not found</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-semibold text-sm truncate">{thread.subject}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {thread.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-gray-100">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-medical-blue focus:border-transparent outline-none"
        />
        <Button
          type="submit"
          size="sm"
          className="rounded-full w-10 h-10 p-0"
          disabled={!content.trim() || sendMessage.isPending}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
