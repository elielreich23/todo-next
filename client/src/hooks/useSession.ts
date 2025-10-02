import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';

export const useSession = () => {
  const { user, isAuthenticated, validateSession, logout } = useUser();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      if (isAuthenticated) {
        const isValid = await validateSession();
        setIsSessionValid(isValid);
      } else {
        setIsSessionValid(false);
      }
      setIsLoading(false);
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
    isLoading,
    clearSession,
    validateSession,
  };
};
