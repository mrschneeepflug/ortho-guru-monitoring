'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInvitePatient } from '@/lib/hooks/use-patient-invite';

interface InvitePatientDialogProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
}

export function InvitePatientDialog({
  patientId,
  patientName,
  open,
  onClose,
}: InvitePatientDialogProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const invite = useInvitePatient();

  const handleGenerate = () => {
    invite.mutate({ patientId, email: email || undefined });
  };

  const handleCopy = async () => {
    if (invite.data?.inviteUrl) {
      await navigator.clipboard.writeText(invite.data.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCopied(false);
    invite.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Invite {patientName} to Portal</h2>
        <p className="text-sm text-gray-500">
          Generate a link to invite this patient to the patient portal where they can upload scans and message you.
        </p>

        {!invite.data ? (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Patient Email (optional)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
              />
              <p className="text-xs text-gray-400">
                Pre-fills the email field on the registration page
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={invite.isPending}>
                {invite.isPending ? 'Generating...' : 'Generate Invite'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Invite Link</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={invite.data.inviteUrl}
                  className="text-xs bg-gray-50"
                />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                This link expires in 7 days. Share it with your patient via text, email, or in person.
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}

        {invite.isError && (
          <p className="text-sm text-red-600">Failed to generate invite. Please try again.</p>
        )}
      </div>
    </Dialog>
  );
}
