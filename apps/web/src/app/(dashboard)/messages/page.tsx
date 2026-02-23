'use client';

import Link from 'next/link';
import { useThreads } from '@/lib/hooks/use-messages';
import { formatRelativeTime } from '@/lib/utils';

export default function MessagesPage() {
  const { data: threads, isLoading } = useThreads();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {threads?.map((thread) => (
            <Link key={thread.id} href={`/messages/${thread.id}`} className="block">
              <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{thread.subject}</p>
                    <p className="text-sm text-gray-500 mt-1 truncate">{thread.lastMessage?.content ?? 'No messages'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatRelativeTime(thread.updatedAt)}</p>
                    {(thread.unreadCount ?? 0) > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-medical-blue text-white rounded-full mt-1">{thread.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )) ?? <p className="text-gray-500">No message threads</p>}
        </div>
      )}
    </div>
  );
}
