import { http, HttpResponse } from 'msw';

const BASE = '/api/v1';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      data: {
        accessToken: 'mock-token',
        user: { id: 'u1', email: 'doc@test.com', name: 'Dr Test', role: 'DOCTOR', practiceId: 'p1' },
      },
    }),
  ),

  // Patients
  http.get(`${BASE}/patients`, () =>
    HttpResponse.json({
      data: { items: [], total: 0, page: 1, limit: 20 },
    }),
  ),
  http.get(`${BASE}/patients/:id`, ({ params }) =>
    HttpResponse.json({
      data: { id: params.id, name: 'Test Patient', status: 'ACTIVE', practiceId: 'p1', doctorId: 'd1', currentStage: 1, scanFrequency: 14, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }),
  ),
  http.post(`${BASE}/patients`, () =>
    HttpResponse.json({ data: { id: 'new-p', name: 'New Patient' } }),
  ),
  http.patch(`${BASE}/patients/:id`, () =>
    HttpResponse.json({ data: { id: 'p1', name: 'Updated' } }),
  ),

  // Scans
  http.get(`${BASE}/scans/sessions`, () =>
    HttpResponse.json({
      data: { items: [], total: 0, page: 1, limit: 20 },
    }),
  ),
  http.get(`${BASE}/scans/sessions/:id`, ({ params }) =>
    HttpResponse.json({
      data: { id: params.id, patientId: 'p1', status: 'PENDING', imageCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }),
  ),
  http.post(`${BASE}/scans/sessions`, () =>
    HttpResponse.json({ data: { id: 'new-s', status: 'PENDING' } }),
  ),

  // Tagging
  http.get(`${BASE}/tagging/sessions/:sessionId/tags`, () =>
    HttpResponse.json({
      data: { id: 't1', overallTracking: 1, oralHygiene: 1, detailTags: [] },
    }),
  ),
  http.post(`${BASE}/tagging/sessions/:sessionId/tags`, () =>
    HttpResponse.json({
      data: { id: 't1', overallTracking: 1, oralHygiene: 1 },
    }),
  ),
  http.get(`${BASE}/tagging/analytics`, () =>
    HttpResponse.json({
      data: { taggingRate: 75, discountPercent: 20, totalSessions: 100, taggedSessions: 75, period: '30d' },
    }),
  ),

  // Messaging
  http.get(`${BASE}/messaging/threads`, () =>
    HttpResponse.json({ data: [] }),
  ),
  http.get(`${BASE}/messaging/threads/:id`, ({ params }) =>
    HttpResponse.json({
      data: { id: params.id, subject: 'Test Thread', messages: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }),
  ),
  http.post(`${BASE}/messaging/messages`, () =>
    HttpResponse.json({
      data: { id: 'm1', content: 'Hello', threadId: 'th1', senderType: 'DOCTOR', createdAt: new Date().toISOString() },
    }),
  ),

  // Dashboard
  http.get(`${BASE}/dashboard/summary`, () =>
    HttpResponse.json({
      data: { pendingScans: 5, totalPatients: 20, compliancePercentage: 85, taggingRate: 72 },
    }),
  ),
  http.get(`${BASE}/dashboard/feed`, () =>
    HttpResponse.json({ data: [] }),
  ),
  http.get(`${BASE}/dashboard/compliance`, () =>
    HttpResponse.json({
      data: { totalActive: 15, onTimeCount: 12, overdueCount: 3, compliancePercentage: 80, overduePatients: [] },
    }),
  ),
];
