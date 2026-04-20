"use client";

import { create } from "zustand";

interface InterviewMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  meta?: string;
}

interface InterviewState {
  sessionId?: string;
  messages: InterviewMessage[];
  currentTopic?: string;
  currentQuestion?: string;
  status?: "active" | "paused" | "completed";
  setSession: (payload: {
    sessionId: string;
    question: string;
    topic: string;
    whyThisMatters?: string;
  }) => void;
  hydrateSession: (payload: {
    sessionId: string;
    messages: InterviewMessage[];
    currentTopic?: string;
    currentQuestion?: string;
    status?: "active" | "paused" | "completed";
  }) => void;
  pushUserAnswer: (answer: string) => void;
  pushEvaluation: (payload: { feedback: string; score: number; nextQuestion: string; topic: string }) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: undefined,
  messages: [],
  currentTopic: undefined,
  currentQuestion: undefined,
  setSession: ({ sessionId, question, topic, whyThisMatters }) =>
    set({
      sessionId,
      currentTopic: topic,
      currentQuestion: question,
      status: "active",
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: question,
          meta: whyThisMatters
        }
      ]
    }),
  hydrateSession: ({ sessionId, messages, currentQuestion, currentTopic, status }) =>
    set({
      sessionId,
      messages,
      currentQuestion,
      currentTopic,
      status
    }),
  pushUserAnswer: (answer) =>
    set((state) => ({
      messages: [...state.messages, { id: crypto.randomUUID(), role: "user", text: answer }]
    })),
  pushEvaluation: ({ feedback, score, nextQuestion, topic }) =>
    set((state) => ({
      currentTopic: topic,
      currentQuestion: nextQuestion,
      status: "active",
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: feedback,
          meta: `Score: ${score}/10`
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: nextQuestion,
          meta: `Next topic focus: ${topic}`
        }
      ]
    })),
  reset: () => set({ sessionId: undefined, messages: [], currentTopic: undefined, currentQuestion: undefined, status: undefined })
}));
