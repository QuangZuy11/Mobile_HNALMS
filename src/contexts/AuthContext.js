import React, { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (authToken) => {
    try {
      setIsLoading(true);
      if (authToken) {
        setToken(authToken);
        // Store token in storage if needed
        // await AsyncStorage.setItem('userToken', authToken);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      // Call signup API here
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setToken(null);
      // await AsyncStorage.removeItem('userToken');
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const value = {
    user,
    token,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
