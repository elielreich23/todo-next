"use client";

import React from 'react';
import WizardModal from '../WizardModal/WizardModal';

export default function ProjectWizard({ isOpen, onClose, onCreate }) {
  const step1Fields = [
    {
      name: 'projectTitle',
      label: 'Project Title',
      placeholder: 'Project Title',
      type: 'text',
    },
    {
      name: 'category',
      label: 'Category',
      placeholder: 'Select Category',
      type: 'select',
      options: ['Design', 'Development', 'Marketing', 'Research'],
    },
    {
      name: 'contributors',
      label: 'Contributors',
      placeholder: 'Add contributors',
      type: 'text',
      helpText: 'You can add up to 50 team members',
    },
    {
      name: 'duration',
      label: 'Project Duration',
      placeholder: 'Select a duration',
      type: 'select',
      options: ['1 week', '2 weeks', '1 month', '3 months', '6 months'],
    },
  ];

  const step2Fields = [
    {
      name: 'description',
      label: 'Description',
      placeholder: 'Describe the project (optional)',
      type: 'textarea',
    },
  ];

  return (
    <WizardModal
      isOpen={isOpen}
      title="Add new project"
      subtitle="You are creating a new project"
      step1Fields={step1Fields}
      step2Fields={step2Fields}
      ctas={{ submitLabel: 'CREATE PROJECT' }}
      onClose={onClose}
      onSubmit={(values) => {
        onCreate?.({
          id: Date.now(),
          name: values.projectTitle || 'Untitled project',
          category: values.category || 'General',
        });
        onClose?.();
      }}
    />
  );
}


