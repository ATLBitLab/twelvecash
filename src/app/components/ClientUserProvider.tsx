"use client";

import { TokenUser } from "@/server/api/trpc";
import React, { createContext, useContext, useState, useEffect } from "react";

interface UserContextType {
  user?: TokenUser;
  setUser: React.Dispatch<React.SetStateAction<TokenUser | undefined>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export default function ClientUserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: TokenUser | undefined;
}) {
  const [user, setUser] = useState<TokenUser | undefined>(initialUser);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
