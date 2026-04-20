"use client";

import { create } from "zustand";

import { apiClient } from "../lib/api";

interface AuthUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  targetRole: string;
  readinessScore?: number;
  candidateProfileCompleted?: boolean;
  requiresCandidateOnboarding?: boolean;
  candidateDetails?: {
    educationQualification: string;
    institution?: string;
    fieldOfStudy: string;
    stream?: string;
    department?: string;
    skills: string[];
    workExperience?: string;
    internshipRole?: string;
    experienceDuration?: string;
    preparingFor: string;
  };
}

interface AuthState {
  token?: string;
  user?: AuthUser;
  hydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
  hydrate: () => void;
}

const storageKey = "ai-interview-auth";

export const useAuthStore = create<AuthState>((set) => ({
  token: undefined,
  user: undefined,
  hydrated: false,
  setSession: (token, user) => {
    apiClient.setToken(token);
    localStorage.setItem(storageKey, JSON.stringify({ token, user }));
    set({ token, user });
  },
  updateUser: (user) =>
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...user } : undefined;

      if (state.token && nextUser) {
        localStorage.setItem(storageKey, JSON.stringify({ token: state.token, user: nextUser }));
      }

      return { user: nextUser };
    }),
  logout: () => {
    apiClient.setToken(undefined);
    localStorage.removeItem(storageKey);
    set({ token: undefined, user: undefined });
  },
  hydrate: () => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      set({ hydrated: true });
      return;
    }

    try {
      const session = JSON.parse(raw) as { token: string; user: AuthUser };
      apiClient.setToken(session.token);
      set({ token: session.token, user: session.user, hydrated: true });
    } catch {
      localStorage.removeItem(storageKey);
      set({ hydrated: true });
    }
  }
}));
