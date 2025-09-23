import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';

export const useSession = () => {
  const { user, isAuthenticated, validateSession, logout } = useUser();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        const isValid = await validateSession();
        setIsSessionValid(isValid);
      } else {
        setIsSessionValid(false);
      }
    };

    checkSession();
  }, [isAuthenticated, validateSession]);

  const clearSession = () => {
    logout();
    setIsSessionValid(false);
  };

  return {
    user,
    isAuthenticated,
    isSessionValid,
    clearSession,
    validateSession,
  };
};
