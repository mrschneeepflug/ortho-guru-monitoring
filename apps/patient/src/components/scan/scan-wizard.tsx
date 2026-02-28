'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnglePrompt } from './angle-prompt';
import { CameraCapture } from './camera-capture';
import { UploadProgress } from './upload-progress';
import { ScanQuestionnaire, INITIAL_QUESTIONNAIRE } from './scan-questionnaire';
import type { QuestionnaireData } from './scan-questionnaire';
import { useCreateScanSession, useUploadScanImage } from '@/lib/hooks/use-scan-upload';
import { IMAGE_TYPES, IMAGE_TYPE_LABELS } from '@/lib/constants';
import type { ScanImage } from '@/lib/types';

type ImageType = ScanImage['imageType'];

type WizardStep = 'intro' | 'questionnaire' | 'capture' | 'review' | 'uploading' | 'done';

export function ScanWizard() {
  const [step, setStep] = useState<WizardStep>('intro');
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [photos, setPhotos] = useState<Record<string, { file: File; preview: string }>>({});
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(INITIAL_QUESTIONNAIRE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCreateScanSession();
  const uploadImage = useUploadScanImage();

  const currentAngle = IMAGE_TYPES[currentAngleIndex];

  const handleCapture = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setPhotos((prev) => ({
      ...prev,
      [currentAngle]: { file, preview },
    }));
  }, [currentAngle]);

  const handleRetake = useCallback(() => {
    setPhotos((prev) => {
      const next = { ...prev };
      if (next[currentAngle]) {
        URL.revokeObjectURL(next[currentAngle].preview);
        delete next[currentAngle];
      }
      return next;
    });
  }, [currentAngle]);

  const handleNext = () => {
    if (currentAngleIndex < IMAGE_TYPES.length - 1) {
      setCurrentAngleIndex((i) => i + 1);
    } else {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (currentAngleIndex > 0) {
      setCurrentAngleIndex((i) => i - 1);
    } else {
      setStep('questionnaire');
    }
  };

  const handleUpload = async () => {
    setStep('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      const session = await createSession.mutateAsync({
        trayNumber: questionnaire.trayNumber!,
        alignerFit: questionnaire.alignerFit!,
        wearTimeHrs: questionnaire.wearTimeHrs ?? undefined,
        attachmentCheck: questionnaire.attachmentCheck!,
        notes: questionnaire.notes || undefined,
      });
      const types = IMAGE_TYPES.filter((t) => photos[t]);

      for (let i = 0; i < types.length; i++) {
        const imageType = types[i];
        await uploadImage.mutateAsync({
          sessionId: session.id,
          imageType: imageType as ImageType,
          file: photos[imageType].file,
        });
        setUploadProgress(i + 1);
      }

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStep('review');
    }
  };

  const handleReset = () => {
    Object.values(photos).forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos({});
    setQuestionnaire(INITIAL_QUESTIONNAIRE);
    setCurrentAngleIndex(0);
    setStep('intro');
    setUploadProgress(0);
    setError(null);
  };

  // ─── Intro ──────────────────────────────────
  if (step === 'intro') {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-medical-blue/10 flex items-center justify-center mx-auto">
            <Camera className="w-10 h-10 text-medical-blue" />
          </div>
          <h2 className="text-xl font-semibold">Take Your Scan Photos</h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            You'll answer a few quick questions and then take 5 photos of your teeth from different angles.
          </p>
          <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
            {IMAGE_TYPES.map((type) => (
              <div key={type} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1">
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[9px] text-gray-500 leading-tight block">
                  {IMAGE_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full max-w-xs" onClick={() => setStep('questionnaire')}>
            Start <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Questionnaire ───────────────────────────
  if (step === 'questionnaire') {
    return (
      <ScanQuestionnaire
        data={questionnaire}
        onChange={setQuestionnaire}
        onNext={() => setStep('capture')}
        onBack={() => setStep('intro')}
      />
    );
  }

  // ─── Capture ────────────────────────────────
  if (step === 'capture') {
    const hasPhoto = !!photos[currentAngle];

    return (
      <Card>
        <CardContent className="py-6 space-y-6">
          <AnglePrompt
            imageType={currentAngle}
            stepNumber={currentAngleIndex + 1}
            totalSteps={IMAGE_TYPES.length}
          />
          <CameraCapture
            preview={photos[currentAngle]?.preview ?? null}
            onCapture={handleCapture}
            onRetake={handleRetake}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button className="flex-1" disabled={!hasPhoto} onClick={handleNext}>
              {currentAngleIndex < IMAGE_TYPES.length - 1 ? 'Next' : 'Review'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Review ─────────────────────────────────
  if (step === 'review') {
    const capturedTypes = IMAGE_TYPES.filter((t) => photos[t]);

    return (
      <Card>
        <CardContent className="py-6 space-y-6">
          <h2 className="text-lg font-semibold text-center">Review Your Photos</h2>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_TYPES.map((type) => (
              <div key={type} className="space-y-1">
                {photos[type] ? (
                  <img
                    src={photos[type].preview}
                    alt={IMAGE_TYPE_LABELS[type]}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <p className="text-[10px] text-gray-500 text-center">{IMAGE_TYPE_LABELS[type]}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setCurrentAngleIndex(0); setStep('capture'); }}>
              Retake
            </Button>
            <Button className="flex-1" disabled={capturedTypes.length === 0} onClick={handleUpload}>
              Upload ({capturedTypes.length} photos)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Uploading ──────────────────────────────
  if (step === 'uploading') {
    const totalPhotos = IMAGE_TYPES.filter((t) => photos[t]).length;

    return (
      <Card>
        <CardContent className="py-12 space-y-6">
          <h2 className="text-lg font-semibold text-center">Uploading...</h2>
          <UploadProgress
            current={uploadProgress}
            total={totalPhotos}
            label="Sending your photos to your doctor"
          />
        </CardContent>
      </Card>
    );
  }

  // ─── Done ───────────────────────────────────
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Photos Uploaded!</h2>
        <p className="text-sm text-gray-600">
          Your doctor will review your photos and get back to you soon.
        </p>
        <Button variant="outline" onClick={handleReset}>
          Take Another Scan
        </Button>
      </CardContent>
    </Card>
  );
}
