/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, account, databases, query } from "../Appwrite/Appwrite";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        const profile = await databases.listDocuments(
          "ems-db",
          "user_profiles",
          [query.equal("userId", user.$id)]
        );
        const userWithProfile = {
          ...user,
          isAdmin: profile.documents[0]?.isAdmin || false,
        };
        setUser(userWithProfile);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Login function
  const signIn = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      const profile = await databases.listDocuments(
        "ems-db",
        "user_profiles",
        [query.equal("userId", currentUser.$id)]
      );
      const userWithProfile = {
        ...currentUser,
        isAdmin: profile.documents[0]?.isAdmin || false,
      };
      setUser(userWithProfile);
      return { success: true, isAdmin: userWithProfile.isAdmin };
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
          "ems-db",
          "user_profiles",
          ID.unique(),
          {
            userId: user.$id,
            isAdmin: true,
            role: adminDetails.role,
            state: adminDetails.state,
            number: adminDetails.number,
            organization: adminDetails.organization,
          },
          [`user:${user.$id}`]
        );
      } else {
        await databases.createDocument(
          "ems-db",
          "user_profiles",
          ID.unique(),
          {
            userId: user.$id,
            isAdmin: false,
          },
          [`user:${user.$id}`]
        );
      }
      // Fetch the full user profile after registration
      const currentUser = await account.get();
      const profile = await databases.listDocuments(
        "ems-db",
        "user_profiles",
        [query.equal("userId", currentUser.$id)]
      );
      const userWithProfile = {
        ...currentUser,
        isAdmin: profile.documents[0]?.isAdmin || false,
      };
      setUser(userWithProfile);
      return { success: true, isAdmin: userWithProfile.isAdmin };
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}