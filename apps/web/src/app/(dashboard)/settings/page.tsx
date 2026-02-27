'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { usePractice, useUpdatePractice } from '@/lib/hooks/use-practices';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const practiceId = user?.practiceId ?? '';
  const { data: practice, isLoading } = usePractice(practiceId);
  const updatePractice = useUpdatePractice();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (practice) {
      setName(practice.name);
      setAddress(practice.address ?? '');
      setPhone(practice.phone ?? '');
    }
  }, [practice]);

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
