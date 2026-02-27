'use client';

import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import type { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isPatient = message.senderType === 'PATIENT';
  const isSystem = message.senderType === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex mb-3', isPatient ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isPatient
            ? 'bg-medical-blue text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md',
        )}
      >
        {!isPatient && (
          <p className="text-[10px] font-medium text-medical-blue mb-0.5">Doctor</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isPatient ? 'text-white/70' : 'text-gray-400',
          )}
        >
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
