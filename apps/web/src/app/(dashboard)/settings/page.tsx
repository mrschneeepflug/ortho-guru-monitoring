'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { usePractice, useUpdatePractice, useUpdatePracticeSettings } from '@/lib/hooks/use-practices';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const practiceId = user?.practiceId ?? '';
  const { data: practice, isLoading } = usePractice(practiceId);
  const updatePractice = useUpdatePractice();
  const updateSettings = useUpdatePracticeSettings();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);

  const [messagingMode, setMessagingMode] = useState<'portal' | 'whatsapp'>('portal');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (practice) {
      setName(practice.name);
      setAddress(practice.address ?? '');
      setPhone(practice.phone ?? '');
      const s = practice.settings as Record<string, unknown> | undefined;
      setMessagingMode((s?.messagingMode as 'portal' | 'whatsapp') ?? 'portal');
      setWhatsappNumber((s?.whatsappNumber as string) ?? '');
    }
  }, [practice]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    await updateSettings.mutateAsync({
      id: practiceId,
      messagingMode,
      whatsappNumber: messagingMode === 'whatsapp' ? whatsappNumber : undefined,
    });
    setSettingsSuccess(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    await updatePractice.mutateAsync({
      id: practiceId,
      name,
      address: address || undefined,
      phone: phone || undefined,
    });
    setSuccess(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Practice Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>

            {updatePractice.isError && (
              <p className="text-sm text-red-600">Failed to save. Please try again.</p>
            )}
            {success && (
              <p className="text-sm text-green-600">Settings saved successfully.</p>
            )}

            <Button type="submit" disabled={updatePractice.isPending}>
              {updatePractice.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Patient Messaging</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsSave} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="block text-sm font-medium text-gray-700 mb-1">Messaging Mode</legend>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="messagingMode"
                  value="portal"
                  checked={messagingMode === 'portal'}
                  onChange={() => setMessagingMode('portal')}
                  className="accent-blue-600"
                />
                <span className="text-sm">In-App Portal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="messagingMode"
                  value="whatsapp"
                  checked={messagingMode === 'whatsapp'}
                  onChange={() => setMessagingMode('whatsapp')}
                  className="accent-blue-600"
                />
                <span className="text-sm">WhatsApp</span>
              </label>
            </fieldset>

            {messagingMode === 'whatsapp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number</label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234567890"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Digits only, including country code (e.g. 1234567890)</p>
              </div>
            )}

            {updateSettings.isError && (
              <p className="text-sm text-red-600">Failed to save messaging settings.</p>
            )}
            {settingsSuccess && (
              <p className="text-sm text-green-600">Messaging settings saved.</p>
            )}

            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save Messaging Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Subscription & Performance</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Subscription Tier</dt>
              <dd className="text-lg font-medium mt-1">{practice?.subscriptionTier ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Tagging Rate</dt>
              <dd className="text-lg font-medium mt-1">{practice?.taggingRate != null ? `${practice.taggingRate}%` : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Discount</dt>
              <dd className="text-lg font-medium mt-1">{practice?.discountPercent != null ? `${practice.discountPercent}%` : '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
