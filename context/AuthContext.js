// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, account } from "../Appwrite/Appwrite";
import { router } from "expo-router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  const getCurrentUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      if(currentUser){
        router.push('/dashboard');
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  // Login function
  const signIn = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register function
  const signUp = async (email, password, name) => {
    try {
      await account.create(ID.unique(), email, password, name);
      // Auto login after registration
      return await signIn(email, password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
