'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useThread, useSendMessage } from '@/lib/hooks/use-messages';
import { useAuthContext } from '@/providers/auth-provider';
import type { Message } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { data: thread, isLoading } = useThread(threadId);
  const { user } = useAuthContext();
  const sendMessage = useSendMessage();
  const [content, setContent] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await sendMessage.mutateAsync({ threadId, content });
    setContent('');
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-gray-200 rounded" />;
  if (!thread) return <p className="text-gray-500">Thread not found</p>;

  const messages = (thread as { messages?: Message[] }).messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-bold mb-4">{thread.subject}</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('max-w-[85%] sm:max-w-[70%] p-3 rounded-lg', msg.senderId === user?.id ? 'ml-auto bg-medical-blue text-white' : 'bg-white shadow-sm')}>
            <p className="text-sm">{msg.content}</p>
            <p className={cn('text-xs mt-1', msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-400')}>{formatDateTime(msg.createdAt)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={sendMessage.isPending}
          className="px-4 sm:px-6 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-dark transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
