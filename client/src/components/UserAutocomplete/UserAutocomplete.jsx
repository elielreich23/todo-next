"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants';
import { getAccessToken } from '../../utils/storage';
import styles from './UserAutocomplete.module.scss';

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_DELAY = 300; // milliseconds

const UserAutocomplete = memo(function UserAutocomplete({
  selectedUsers = [],
  onUsersChange,
  placeholder = "Search users by name, username, or email...",
  maxUsers = 50
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch users from backend
  const searchUsers = useCallback(async (query) => {
    if (query.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.USERS_SEARCH}?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();

      if (data.success) {
        // Filter out already selected users
        const filteredUsers = data.users.filter(
          user => !selectedUsers.some(selected => selected.id === user.id)
        );
        setSuggestions(filteredUsers);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUsers]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length >= MIN_SEARCH_LENGTH) {
      debounceTimerRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, DEBOUNCE_DELAY);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= MIN_SEARCH_LENGTH);
  };

  // Handle user selection
  const handleSelectUser = (user) => {
    if (selectedUsers.length >= maxUsers) {
      setError(`Maximum ${maxUsers} users allowed`);
      return;
    }

    if (!selectedUsers.some(selected => selected.id === user.id)) {
      onUsersChange([...selectedUsers, user]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Handle remove user
  const handleRemoveUser = (userId) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId));
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get display name for user
  const getUserDisplayName = (user) => {
    return user.full_name || user.username || user.email || 'Unknown User';
  };

  return (
    <div className={styles.userAutocomplete}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= MIN_SEARCH_LENGTH && setShowSuggestions(true)}
          placeholder={placeholder}
          className={styles.input}
        />
        {isLoading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {searchQuery.length > 0 && searchQuery.length < MIN_SEARCH_LENGTH && (
        <div className={styles.hint}>
          Type at least {MIN_SEARCH_LENGTH} characters to search
        </div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className={styles.selectedUsers}>
          {selectedUsers.map(user => (
            <div key={user.id} className={styles.userTag}>
              <span className={styles.userName}>{getUserDisplayName(user)}</span>
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                className={styles.removeButton}
                aria-label={`Remove ${getUserDisplayName(user)}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div ref={suggestionsRef} className={styles.suggestions}>
          {suggestions.length === 0 && !isLoading && searchQuery.length >= MIN_SEARCH_LENGTH && (
            <div className={styles.noResults}>No users found</div>
          )}
          {suggestions.map(user => (
            <div
              key={user.id}
              className={styles.suggestionItem}
              onClick={() => handleSelectUser(user)}
            >
              <div className={styles.userInfo}>
                <div className={styles.userName}>{getUserDisplayName(user)}</div>
                {user.email && (
                  <div className={styles.userEmail}>{user.email}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default UserAutocomplete;
