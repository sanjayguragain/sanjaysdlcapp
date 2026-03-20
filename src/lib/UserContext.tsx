"use client";

import React, { createContext, useContext, useState } from "react";
import { UserRole } from "@/types";

export interface Persona {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  initials: string;
  color: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "pm",
    name: "Alex Chen",
    role: "Product Manager",
    email: "alex@company.com",
    initials: "AC",
    color: "bg-edison-600",
  },
  {
    id: "sec",
    name: "Sarah Kim",
    role: "Security Lead",
    email: "sarah@company.com",
    initials: "SK",
    color: "bg-red-600",
  },
  {
    id: "comp",
    name: "Mike Johnson",
    role: "Compliance Officer",
    email: "mike@company.com",
    initials: "MJ",
    color: "bg-amber-600",
  },
  {
    id: "qa",
    name: "Priya Patel",
    role: "QA Lead",
    email: "priya@company.com",
    initials: "PP",
    color: "bg-green-600",
  },
  {
    id: "infra",
    name: "Tom Davis",
    role: "Infrastructure Lead",
    email: "tom@company.com",
    initials: "TD",
    color: "bg-blue-600",
  },
  {
    id: "exec",
    name: "Lisa Wang",
    role: "Executive Stakeholder",
    email: "lisa@company.com",
    initials: "LW",
    color: "bg-purple-600",
  },
];

interface UserContextType {
  currentUser: Persona;
  setCurrentUser: (persona: Persona) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: PERSONAS[0],
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Persona>(PERSONAS[0]);
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
