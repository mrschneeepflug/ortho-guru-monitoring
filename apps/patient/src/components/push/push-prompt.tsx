'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';

export function PushPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('push_prompt_dismissed') === 'true';
  });

  const { isSupported, isSubscribed, isLoading, permission, subscribe } =
    usePushNotifications();

  if (
    !isSupported ||
    isSubscribed ||
    isLoading ||
    permission === 'denied' ||
    dismissed
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  return (
    <Card className="bg-medical-light border-medical-blue/20">
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-medical-blue/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-medical-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-medical-dark">
              Stay updated
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get notified when your doctor reviews your scans or sends you a
              message.
            </p>
            <Button
              size="sm"
              className="mt-2 bg-medical-blue hover:bg-medical-blue/90"
              onClick={subscribe}
              disabled={isLoading}
            >
              Enable Notifications
            </Button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
