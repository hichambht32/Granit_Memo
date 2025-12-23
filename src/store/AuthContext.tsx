import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, Family } from "../types";

interface AuthContextType {
  user: User | null;
  family: Family | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  createFamily: (name: string) => Promise<string>;
  joinFamily: (inviteCode: string) => Promise<boolean>;
  leaveFamily: () => void;
  updateFamilyMembers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "memolil-users";
const FAMILIES_STORAGE_KEY = "memolil-families";
const CURRENT_USER_KEY = "memolil-current-user";

interface StoredUser extends User {
  password: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);

  // Load current user on mount
  useEffect(() => {
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserId) {
      const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const foundUser = users.find((u) => u.id === currentUserId);
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        
        // Load family if user has one
        if (foundUser.familyId) {
          loadFamily(foundUser.familyId);
        }
      }
    }
  }, []);

  const loadFamily = (familyId: string) => {
    const families: Family[] = JSON.parse(localStorage.getItem(FAMILIES_STORAGE_KEY) || "[]");
    const foundFamily = families.find((f) => f.id === familyId);
    if (foundFamily) {
      setFamily(foundFamily);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      
      // Check if user already exists
      if (users.some((u) => u.email === email)) {
        alert("User with this email already exists!");
        return false;
      }

      const newUser: StoredUser = {
        id: generateId(),
        email,
        name,
        password, // In production, this should be hashed!
        createdAt: Date.now(),
        familyId: null,
      };

      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_KEY, newUser.id);

      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const foundUser = users.find((u) => u.email === email && u.password === password);

      if (!foundUser) {
        alert("Invalid email or password!");
        return false;
      }

      localStorage.setItem(CURRENT_USER_KEY, foundUser.id);
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);

      // Load family if user has one
      if (foundUser.familyId) {
        loadFamily(foundUser.familyId);
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setFamily(null);
  };

  const createFamily = async (name: string): Promise<string> => {
    if (!user) throw new Error("Must be logged in to create a family");

    const families: Family[] = JSON.parse(localStorage.getItem(FAMILIES_STORAGE_KEY) || "[]");
    
    const newFamily: Family = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      createdBy: user.id,
      inviteCode: generateInviteCode(),
      members: [
        {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          joinedAt: Date.now(),
          role: "owner",
        },
      ],
    };

    families.push(newFamily);
    localStorage.setItem(FAMILIES_STORAGE_KEY, JSON.stringify(families));

    // Update user's familyId
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].familyId = newFamily.id;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setUser({ ...user, familyId: newFamily.id });
    }

    setFamily(newFamily);
    return newFamily.inviteCode;
  };

  const joinFamily = async (inviteCode: string): Promise<boolean> => {
    if (!user) {
      alert("Must be logged in to join a family");
      return false;
    }

    const families: Family[] = JSON.parse(localStorage.getItem(FAMILIES_STORAGE_KEY) || "[]");
    const familyIndex = families.findIndex((f) => f.inviteCode === inviteCode);

    if (familyIndex === -1) {
      alert("Invalid invite code!");
      return false;
    }

    // Check if user is already in the family
    if (families[familyIndex].members.some((m) => m.userId === user.id)) {
      alert("You are already a member of this family!");
      return false;
    }

    // Add user to family
    families[familyIndex].members.push({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      joinedAt: Date.now(),
      role: "member",
    });

    localStorage.setItem(FAMILIES_STORAGE_KEY, JSON.stringify(families));

    // Update user's familyId
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].familyId = families[familyIndex].id;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setUser({ ...user, familyId: families[familyIndex].id });
    }

    setFamily(families[familyIndex]);
    return true;
  };

  const leaveFamily = () => {
    if (!user || !family) return;

    const families: Family[] = JSON.parse(localStorage.getItem(FAMILIES_STORAGE_KEY) || "[]");
    const familyIndex = families.findIndex((f) => f.id === family.id);

    if (familyIndex !== -1) {
      // Remove user from family
      families[familyIndex].members = families[familyIndex].members.filter(
        (m) => m.userId !== user.id
      );

      // If family is empty, delete it
      if (families[familyIndex].members.length === 0) {
        families.splice(familyIndex, 1);
      }

      localStorage.setItem(FAMILIES_STORAGE_KEY, JSON.stringify(families));
    }

    // Update user's familyId
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].familyId = null;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setUser({ ...user, familyId: null });
    }

    setFamily(null);
  };

  const updateFamilyMembers = () => {
    if (user?.familyId) {
      loadFamily(user.familyId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        createFamily,
        joinFamily,
        leaveFamily,
        updateFamilyMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
