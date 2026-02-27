'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import type { MessageThread } from '@/lib/types';

interface ThreadListItemProps {
  thread: MessageThread;
}

export function ThreadListItem({ thread }: ThreadListItemProps) {
  return (
    <Link
      href={`/messages/${thread.id}`}
      className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-medical-blue/10 flex items-center justify-center flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-medical-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium truncate">{thread.subject}</h3>
          {thread.unreadCount > 0 && (
            <Badge className="bg-medical-blue text-white flex-shrink-0">
              {thread.unreadCount}
            </Badge>
          )}
        </div>
        {thread.lastMessage && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {thread.lastMessage.content}
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {formatRelativeTime(thread.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
