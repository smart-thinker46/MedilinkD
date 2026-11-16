import React from "react";
import { PatientRegistrationForm, type PatientRegistrationFormProps } from "./PatientRegistrationForm";

export interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
  onSubmit: (data: any) => Promise<any>;
  initialData?: any;
}

export function PatientForm({
  isOpen,
  onClose,
  onCancel,
  onError,
  onSubmit,
  initialData,
}: PatientFormProps) {
  return (
    <PatientRegistrationForm
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      onError={onError}
      onSubmit={onSubmit}
      initialData={initialData}
      editingPatient={initialData}
    />
  );
}

export default PatientForm;
