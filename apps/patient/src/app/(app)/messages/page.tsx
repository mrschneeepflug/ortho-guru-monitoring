'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThreadListItem } from '@/components/messages/thread-list-item';
import { usePatientThreads } from '@/lib/hooks/use-patient-messages';
import { usePatientProfile } from '@/lib/hooks/use-patient-profile';

export default function MessagesPage() {
  const router = useRouter();
  const { data: profile } = usePatientProfile();
  const { data: threads, isLoading } = usePatientThreads();

  const messagingMode = profile?.practiceSettings?.messagingMode ?? 'portal';

  useEffect(() => {
    if (messagingMode === 'whatsapp') {
      router.replace('/home');
    }
  }, [messagingMode, router]);

  if (messagingMode === 'whatsapp') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Messages</h2>

      {!threads || threads.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">No messages yet</p>
          <p className="text-gray-400 text-xs">Your doctor will reach out to you here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
