"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { API_ENDPOINTS } from '../../constants';
import { api } from '../../lib/api';
import styles from './PasswordStrengthMeter.module.scss';

/**
 * Password Strength Meter Component
 *
 * Displays real-time password strength feedback with visual indicators.
 * Uses zxcvbn algorithm via backend API for accurate strength assessment.
 */
const PasswordStrengthMeter = memo(function PasswordStrengthMeter({
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
      const data = await api(API_ENDPOINTS.AUTH.PASSWORD_CHECK_STRENGTH, {
        method: 'POST',
        body: JSON.stringify({
          password: pwd,
          user_inputs: userInputs
        }),
      }, false); // Don't cache password strength checks

      if (data && data.success && data.strength) {
        const strengthData = {
          score: data.strength.score,
          label: data.strength.label,
          feedback: data.strength.feedback || { warning: '', suggestions: [] },
          crackTimesDisplay: data.strength.crack_times_display || {}
        };

        // Use the backend's label if available, otherwise map from score
        const displayLabel = strengthData.label || getStrengthLabel(strengthData.score);

        setStrength({
          ...strengthData,
          label: displayLabel
        });

        // Notify parent component
        if (onStrengthChange) {
          onStrengthChange({
            score: strengthData.score,
            isValid: strengthData.score >= minScore,
            label: displayLabel
          });
        }
      } else {
        // If response doesn't have expected format, use fallback
        console.warn('Unexpected API response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Fallback: use basic client-side validation
      const basicScore = calculateBasicStrength(pwd);
      const basicLabel = getStrengthLabel(basicScore);
      setStrength({
        score: basicScore,
        label: basicLabel,
        feedback: { warning: '', suggestions: [] },
        crackTimesDisplay: {}
      });
      if (onStrengthChange) {
        onStrengthChange({
          score: basicScore,
          isValid: basicScore >= minScore,
          label: basicLabel
        });
      }
    } finally {
      setIsChecking(false);
    }
  }, [userInputs, onStrengthChange, minScore]);

  // Client-side fallback strength calculation
  // Note: This is less accurate than backend zxcvbn, but provides a fallback
  const calculateBasicStrength = (pwd) => {
    if (!pwd || pwd.length === 0) return 0;

    let score = 0;
    // Length checks (more weight on longer passwords)
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    // Character variety checks
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    // Cap at 4 (strong)
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

  // Track last checked password to avoid duplicate API calls
  const lastCheckedPasswordRef = useRef('');
  const timeoutRef = useRef(null);

  // Debounced strength check - only check after user stops typing for 2 seconds
  const debouncedCheck = useCallback((pwd) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If password is empty, reset immediately without API call
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
      lastCheckedPasswordRef.current = '';
      return;
    }

    // If we already checked this exact password, don't check again
    if (pwd === lastCheckedPasswordRef.current) {
      return;
    }

    // Wait 2 seconds after user stops typing before checking
    timeoutRef.current = setTimeout(() => {
      // Verify password hasn't changed during the delay
      if (pwd === password) {
        checkPasswordStrength(pwd);
        lastCheckedPasswordRef.current = pwd;
      }
    }, 2000); // 2 second delay - only check when user finishes typing
  }, [checkPasswordStrength, password]);

  // Check strength when password changes (with 2 second debounce)
  useEffect(() => {
    debouncedCheck(password);

    // Cleanup timeout on unmount or when password changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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
});

export default PasswordStrengthMeter;
