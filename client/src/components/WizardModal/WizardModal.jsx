"use client";

import React, { useEffect, useMemo, useState } from 'react';
import styles from './wizardModal.module.scss';

/**
 * A reusable multi-step modal wizard used for creating entities (projects, tasks, etc.).
 *
 * Props:
 * - isOpen: boolean — controls visibility
 * - title: string — main heading (e.g., "Add new project")
 * - subtitle: string — small description under heading
 * - step1Fields: Array<Field> — descriptors for fields in step 1
 * - step2Fields: Array<Field> — descriptors for fields in step 2
 * - steps: Array<Array<Field>> — optional, supports any number of steps
 * - stepDescriptions: Array<string> — optional descriptions for steps
 * - ctas: { cancelLabel?: string, nextLabel?: string, backLabel?: string, submitLabel?: string }
 * - onClose: () => void — called when modal is dismissed
 * - onSubmit: (formValues) => void — called when user completes last step
 *
 * Field descriptor shape:
 * { name: string, label: string, placeholder?: string, type?: 'text'|'select'|'textarea'|'date'|'number', options?: Array<string> }
 */
export default function WizardModal({
  isOpen,
  title = 'Add new item',
  subtitle = 'You are creating a new item',
  step1Fields = [],
  step2Fields = [],
  steps, // optional Array<Array<Field>> to support any number of steps
  stepDescriptions = [], // optional Array<string> matching steps length
  ctas = {},
  onClose,
  onSubmit,
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({});

  const { cancelLabel, nextLabel, backLabel, submitLabel } = useMemo(
    () => ({
      cancelLabel: ctas.cancelLabel || 'CANCEL',
      nextLabel: ctas.nextLabel || 'NEXT',
      backLabel: ctas.backLabel || 'PREVIOUS',
      submitLabel: ctas.submitLabel || 'CREATE',
    }),
    [ctas]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setValues({});
    }
  }, [isOpen]);

  // Initialize form values with default values when modal opens
  useEffect(() => {
    if (isOpen && steps && steps.length > 0) {
      const initialValues = {};
      steps.forEach((stepFields) => {
        stepFields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            initialValues[field.name] = field.defaultValue;
          }
        });
      });
      setValues(initialValues);
    }
  }, [isOpen, steps]);

  const normalizedSteps = useMemo(() => {
    if (Array.isArray(steps) && steps.length > 0) return steps;
    return [step1Fields, step2Fields].filter(
      (arr) => Array.isArray(arr) && arr.length >= 0
    );
  }, [steps, step1Fields, step2Fields]);

  const totalSteps = normalizedSteps.length || 1;
  const fieldsForCurrentStep =
    normalizedSteps[Math.max(0, Math.min(step - 1, totalSteps - 1))] || [];

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderField = (field) => {
    // Handle custom field rendering
    if (field.type === 'custom' && field.renderCustom) {
      return field.renderCustom(field, values, handleChange);
    }

    const commonProps = {
      id: field.name,
      name: field.name,
      value:
        values[field.name] !== undefined
          ? values[field.name]
          : field.defaultValue || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      placeholder: field.placeholder || '',
      className: styles.input,
    };

    switch (field.type) {
      case 'select':
        return (
          <select
            {...commonProps}
            className={`${styles.input} ${styles.select}`}
          >
            <option value="" disabled>
              {field.placeholder || 'Select'}
            </option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            className={`${styles.input} ${styles.textarea}`}
            rows={4}
          />
        );
      case 'date':
        return <input {...commonProps} type="date" />;
      case 'number':
        return <input {...commonProps} type="number" />;
      default:
        return <input {...commonProps} type={field.type || 'text'} />;
    }
  };

  const handleNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleSubmit = () => onSubmit?.(values);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={styles.stepInfo}>
            <span className={styles.stepText}>
              Step {step} of {totalSteps}
            </span>
            <div className={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${
                    step >= idx + 1 ? styles.active : ''
                  }`}
                ></span>
              ))}
            </div>
            {stepDescriptions?.[step - 1] && (
              <span className={styles.stepHint}>
                {stepDescriptions[step - 1]}
              </span>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          {fieldsForCurrentStep.map((field) => (
            <div className={styles.formGroup} key={field.name}>
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
              </label>
              {renderField(field)}
              {field.helpText && (
                <small className={styles.helpText}>{field.helpText}</small>
              )}
            </div>
          ))}
        </div>

        {/* Footer with proper Cancel/Previous logic */}
        <div className={styles.footerRow}>
          {step === 1 ? (
            // First step → Cancel + Next
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={onClose}
              >
                {cancelLabel}
              </button>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleNext}
              >
                {nextLabel}
              </button>
            </>
          ) : step < totalSteps ? (
            // Middle steps → Previous + Next
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleBack}
              >
                {backLabel}
              </button>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleNext}
              >
                {nextLabel}
              </button>
            </>
          ) : (
            // Last step → Previous + Submit
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleBack}
              >
                {backLabel}
              </button>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleSubmit}
              >
                {submitLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
