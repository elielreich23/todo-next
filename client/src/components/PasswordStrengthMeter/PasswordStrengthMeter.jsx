"use client";

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants';
import styles from './PasswordStrengthMeter.module.scss';

/**
 * Password Strength Meter Component
 *
 * Displays real-time password strength feedback with visual indicators.
 * Uses zxcvbn algorithm via backend API for accurate strength assessment.
 */
export default function PasswordStrengthMeter({
  password,
  userInputs = [],
  onStrengthChange,
  showFeedback = true,
  minScore = 2
}) {
  const [strength, setStrength] = useState({
    score: 0,
    label: 'too_weak',
    feedback: { warning: '', suggestions: [] },
    crackTimesDisplay: {}
  });
  const [isChecking, setIsChecking] = useState(false);

  // Debounce function to avoid excessive API calls
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Check password strength
  const checkPasswordStrength = useCallback(async (pwd) => {
    if (!pwd || pwd.length === 0) {
      setStrength({
        score: 0,
        label: 'too_weak',
        feedback: { warning: '', suggestions: [] },
        crackTimesDisplay: {}
      });
      if (onStrengthChange) {
        onStrengthChange({ score: 0, isValid: false });
      }
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD_CHECK_STRENGTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: pwd,
          user_inputs: userInputs
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.strength) {
          const strengthData = {
            score: data.strength.score,
            label: data.strength.label,
            feedback: data.strength.feedback || { warning: '', suggestions: [] },
            crackTimesDisplay: data.strength.crack_times_display || {}
          };
          setStrength(strengthData);

          // Notify parent component
          if (onStrengthChange) {
            onStrengthChange({
              score: strengthData.score,
              isValid: strengthData.score >= minScore,
              label: strengthData.label
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking password strength:', error);
      // Fallback: use basic client-side validation
      const basicScore = calculateBasicStrength(pwd);
      setStrength({
        score: basicScore,
        label: getStrengthLabel(basicScore),
        feedback: { warning: '', suggestions: [] },
        crackTimesDisplay: {}
      });
      if (onStrengthChange) {
        onStrengthChange({ score: basicScore, isValid: basicScore >= minScore });
      }
    } finally {
      setIsChecking(false);
    }
  }, [userInputs, onStrengthChange, minScore]);

  // Client-side fallback strength calculation
  const calculateBasicStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const getStrengthLabel = (score) => {
    const labels = {
      0: 'too_weak',
      1: 'weak',
      2: 'fair',
      3: 'good',
      4: 'strong'
    };
    return labels[score] || 'too_weak';
  };

  // Debounced strength check
  const debouncedCheck = useCallback(
    debounce((pwd) => {
      checkPasswordStrength(pwd);
    }, 300),
    [checkPasswordStrength]
  );

  // Check strength when password changes
  useEffect(() => {
    debouncedCheck(password);
  }, [password, debouncedCheck]);

  // Strength configuration - matching the image design
  const strengthConfig = {
    0: { label: 'Too Weak', color: '#ef4444', segments: 0 },
    1: { label: 'Weak', color: '#f97316', segments: 1 },
    2: { label: 'Fair', color: '#eab308', segments: 1 },
    3: { label: 'Good', color: '#10b981', segments: 2 },
    4: { label: 'Strong', color: '#10b981', segments: 3 }  // Green for both Good and Strong
  };

  const config = strengthConfig[strength.score] || strengthConfig[0];
  const isMinimumMet = strength.score >= minScore;

  // Get feedback message
  const getFeedbackMessage = () => {
    if (!password) return '';

    if (strength.feedback && strength.feedback.suggestions && strength.feedback.suggestions.length > 0) {
      return strength.feedback.suggestions[0];
    }

    if (strength.score < 3) {
      return 'Make your password even stronger by including more than 10 characters, numbers, symbols, upper and lowercase letters.';
    }

    return '';
  };

  const feedbackMessage = getFeedbackMessage();

  return (
    <div className={styles.container}>
      {/* Password Strength Label and Status */}
      {password && (
        <div className={styles.strengthHeader}>
          <span className={styles.strengthLabel}>Password strength</span>
          <span
            className={styles.strengthValue}
            style={{ color: config.color }}
          >
            {config.label}
            {isChecking && <span className={styles.checking}>...</span>}
          </span>
        </div>
      )}

      {/* Segmented Strength Indicator */}
      {password && (
        <div className={styles.segmentsContainer}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`${styles.segment} ${
                index < config.segments ? styles.filled : ''
              }`}
              style={{
                backgroundColor: index < config.segments ? config.color : '#e5e7eb'
              }}
            />
          ))}
        </div>
      )}

      {/* Feedback Message */}
      {password && feedbackMessage && showFeedback && (
        <p className={styles.feedbackMessage}>
          {feedbackMessage}
        </p>
      )}
    </div>
  );
}
