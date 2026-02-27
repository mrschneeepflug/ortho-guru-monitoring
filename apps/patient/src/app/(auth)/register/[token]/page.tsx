'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientAuth } from '@/providers/patient-auth-provider';
import apiClient from '@/lib/api-client';
import type { ApiResponse, InviteValidation } from '@/lib/types';

export default function RegisterPage() {
  const { token } = useParams<{ token: string }>();
  const { register } = usePatientAuth();

  const [invite, setInvite] = useState<InviteValidation | null>(null);
  const [validating, setValidating] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const { data } = await apiClient.get<ApiResponse<InviteValidation>>(
          `/patient-auth/validate-invite/${token}`,
        );
        setInvite(data.data);
        if (data.data.email) setEmail(data.data.email);
      } catch {
        setInviteError('This invite link is invalid or has expired.');
      } finally {
        setValidating(false);
      }
    }
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(token, email, password);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (inviteError) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-red-600">{inviteError}</p>
          <Link href="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Welcome, {invite?.patientName}!</h2>
            <p className="text-sm text-gray-500 mt-1">Create your account to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-medical-blue hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
