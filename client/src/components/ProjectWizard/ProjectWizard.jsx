"use client";

import React, { useState, useEffect } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import UserAutocomplete from '../UserAutocomplete/UserAutocomplete';
import { api } from '../../lib/api';
import { VALIDATION } from '../../constants';

export default function ProjectWizard({ isOpen, onClose, onCreate }) {
  const [selectedContributors, setSelectedContributors] = useState([]);

  // Reset contributors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedContributors([]);
    }
  }, [isOpen]);

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
      placeholder: 'Search and add contributors...',
      type: 'custom',
      helpText: `You can add up to ${VALIDATION.MAX_CONTRIBUTORS} team members`,
      renderCustom: (field, values, handleChange) => (
        <UserAutocomplete
          selectedUsers={selectedContributors}
          onUsersChange={setSelectedContributors}
          placeholder={field.placeholder}
          maxUsers={VALIDATION.MAX_CONTRIBUTORS}
        />
      )
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
          contributors: selectedContributors, // Send user objects with IDs
          duration: values.duration,
          description: values.description,
        });
        onClose?.();
      }}
    />
  );
}
