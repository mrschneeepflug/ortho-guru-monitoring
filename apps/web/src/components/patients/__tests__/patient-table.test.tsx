import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientTable } from '../patient-table';
import type { Patient } from '@/lib/types';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockPatient: Patient = {
  id: 'p1',
  practiceId: 'pr1',
  doctorId: 'd1',
  name: 'Alice Smith',
  dateOfBirth: '1990-01-01',
  treatmentType: 'Invisalign',
  alignerBrand: 'Invisalign',
  currentStage: 5,
  totalStages: 20,
  scanFrequency: 14,
  status: 'ACTIVE',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

describe('PatientTable', () => {
  const defaultProps = {
    patients: [mockPatient],
    loading: false,
    total: 1,
    page: 1,
    limit: 20,
    onPageChange: vi.fn(),
  };

  it('should render patient data in table', () => {
    render(<PatientTable {...defaultProps} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Invisalign')).toBeInTheDocument();
    expect(screen.getByText('5/20')).toBeInTheDocument();
    expect(screen.getByText('Every 14d')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    render(<PatientTable {...defaultProps} loading={true} />);

    // Should not show patient data
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    // Should show skeleton placeholders (animated divs)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should calculate total pages correctly', () => {
    render(
      <PatientTable {...defaultProps} total={45} page={1} limit={20} />,
    );

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(<PatientTable {...defaultProps} total={40} page={1} limit={20} />);

    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(<PatientTable {...defaultProps} total={40} page={2} limit={20} />);

    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('should not show pagination when only one page', () => {
    render(<PatientTable {...defaultProps} total={5} page={1} limit={20} />);

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('should show N/A for null treatment type', () => {
    const patientWithoutTreatment = { ...mockPatient, treatmentType: null };
    render(<PatientTable {...defaultProps} patients={[patientWithoutTreatment]} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should show ? for null total stages', () => {
    const patientWithoutStages = { ...mockPatient, totalStages: null };
    render(<PatientTable {...defaultProps} patients={[patientWithoutStages]} />);

    expect(screen.getByText('5/?')).toBeInTheDocument();
  });
});
