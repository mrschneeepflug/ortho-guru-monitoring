import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from '../patient-form';

// The form labels don't use htmlFor, so we find inputs via their parent label text
function getInputByLabel(labelText: RegExp): HTMLInputElement {
  const label = screen.getByText(labelText);
  const container = label.closest('div')!;
  return container.querySelector('input')! as HTMLInputElement;
}

describe('PatientForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<PatientForm onSubmit={mockSubmit} />);

    expect(screen.getByText(/patient name/i)).toBeInTheDocument();
    expect(screen.getByText(/doctor id/i)).toBeInTheDocument();
    expect(screen.getByText(/treatment type/i)).toBeInTheDocument();
    expect(screen.getByText(/aligner brand/i)).toBeInTheDocument();
    expect(screen.getByText(/total stages/i)).toBeInTheDocument();
    expect(screen.getByText(/scan frequency/i)).toBeInTheDocument();
  });

  it('should convert empty optional strings to undefined on submit', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockSubmit} />);

    const nameInput = getInputByLabel(/patient name/i);
    const doctorInput = getInputByLabel(/doctor id/i);

    await user.type(nameInput, 'Alice');
    await user.type(doctorInput, 'd1');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        doctorId: 'd1',
        treatmentType: undefined,
        alignerBrand: undefined,
        totalStages: undefined,
      }),
    );
  });

  it('should parseInt totalStages when provided', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockSubmit} />);

    const nameInput = getInputByLabel(/patient name/i);
    const doctorInput = getInputByLabel(/doctor id/i);
    const stagesInput = getInputByLabel(/total stages/i);

    await user.type(nameInput, 'Bob');
    await user.type(doctorInput, 'd1');
    await user.clear(stagesInput);
    await user.type(stagesInput, '20');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        totalStages: 20,
      }),
    );
  });

  it('should parseInt scanFrequency (default 14)', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockSubmit} />);

    const nameInput = getInputByLabel(/patient name/i);
    const doctorInput = getInputByLabel(/doctor id/i);

    await user.type(nameInput, 'Charlie');
    await user.type(doctorInput, 'd1');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scanFrequency: 14,
      }),
    );
  });

  it('should show loading state when loading prop is true', () => {
    render(<PatientForm onSubmit={mockSubmit} loading />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Creating...');
  });

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup();
    const submitFn = vi.fn().mockResolvedValue(undefined);
    render(<PatientForm onSubmit={submitFn} />);

    const nameInput = getInputByLabel(/patient name/i);
    const doctorInput = getInputByLabel(/doctor id/i);

    await user.type(nameInput, 'Test');
    await user.type(doctorInput, 'd1');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(submitFn).toHaveBeenCalledTimes(1);
  });
});
