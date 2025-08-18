// context/AuthContext.js
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, account, databases } from "../Appwrite/Appwrite";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  const getCurrentUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      if (currentUser) {
        router.push("/dashboard/home");
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
  const signUp = async (email, password, name, isAdmin, adminDetails) => {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password); // Auto-login
      if (isAdmin) {
        await databases.createDocument(
          'ems-db', // Replace with your database ID
          'user_profiles', // Collection ID
          ID.unique(),
          {
            userId: user.$id,
            isAdmin: true,
            role: adminDetails.role,
            state: adminDetails.state,
            number: adminDetails.number,
            organization: adminDetails.organization,
          },
          [`user:${user.$id}`] // Permissions: only this user can read/write
        );
      } else {
        await databases.createDocument(
          'ems-db',
          'user_profiles',
          ID.unique(),
          {
            userId: user.$id,
            isAdmin: false,
          },
          [`user:${user.$id}`]
        );
      }
      setUser(user);
      return { success: true };
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
