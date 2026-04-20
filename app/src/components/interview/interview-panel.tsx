"use client";

import type { ChangeEvent } from "react";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useInterviewStore } from "@/store/interview-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatWindow } from "./chat-window";
import { InterviewHistorySidebar } from "./history-sidebar";

const companyOptions = ["Google", "Amazon", "TCS", "Microsoft", "Infosys"];

interface InterviewHistoryItem {
  id: string;
  role: string;
  mode: "mock" | "company";
  company?: string;
  topics: string[];
  category: "technical" | "management" | "general";
  status: "active" | "paused" | "completed";
  startedAt: string;
  updatedAt: string;
  endedAt?: string;
  averageScore: number;
  interactionCount: number;
  preview: string;
  resumable: boolean;
}

export function InterviewPanel({
  mode,
  historyFilterMode,
  initialHistoryOpen = false,
  historyOnly = false
}: {
  mode: "mock" | "company";
  historyFilterMode?: "mock" | "company" | "all";
  initialHistoryOpen?: boolean;
  historyOnly?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const interview = useInterviewStore();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [completion, setCompletion] = useState<string>();
  const [insight, setInsight] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(initialHistoryOpen);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySessions, setHistorySessions] = useState<InterviewHistoryItem[]>([]);
  const [resumeFileName, setResumeFileName] = useState<string>();
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceSeedRef = useRef("");
  const [form, setForm] = useState({
    role: user?.targetRole ?? "Full-Stack Engineer",
    topics: "DSA, DBMS, System Design",
    category: "technical",
    company: "Google",
    resumeText: "",
    answer: ""
  });

  const speechSupported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (user?.targetRole) {
      setForm((state) => ({
        ...state,
        role: state.role || user.targetRole
      }));
    }
  }, [user?.targetRole]);

  useEffect(() => {
    void loadHistory();
  }, [mode, historyFilterMode]);

  useEffect(() => {
    setHistoryOpen(initialHistoryOpen);
  }, [initialHistoryOpen]);

  useEffect(() => {
    if (!historyOnly) {
      interview.reset();
      setCompletion(undefined);
      setInsight(undefined);
      setError(undefined);
      setForm((state) => ({ ...state, answer: "" }));
    }
  }, [historyOnly]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.request<{ sessions: InterviewHistoryItem[] }>("/interviews/sessions");
      setHistorySessions(
        response.sessions.filter((session) =>
          historyFilterMode === "all" || !historyFilterMode ? true : session.mode === historyFilterMode,
        ),
      );
    } catch (historyError) {
      console.error(historyError);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startSession = async () => {
    setLoading(true);
    setCompletion(undefined);
    setError(undefined);

    try {
      const response = await apiClient.request<{
        sessionId: string;
        openingQuestion: { question: string; topic: string; whyThisMatters: string };
        personalizedInsight: string;
      }>("/interviews/sessions", {
        method: "POST",
        body: JSON.stringify({
          role: form.role,
          topics: form.topics.split(",").map((topic) => topic.trim()).filter(Boolean),
          category: form.category,
          mode,
          company: mode === "company" ? form.company : undefined,
          resumeText: form.resumeText.trim() || undefined
        })
      });

      interview.setSession({
        sessionId: response.sessionId,
        question: response.openingQuestion.question,
        topic: response.openingQuestion.topic,
        whyThisMatters: response.openingQuestion.whyThisMatters
      });
      setInsight(response.personalizedInsight);
      await loadHistory();
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "Unable to start session");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interview.sessionId || !interview.currentQuestion || !interview.currentTopic || !form.answer) {
      setError("Start a session and provide an answer before submitting.");
      return;
    }

    setLoading(true);
    setError(undefined);
    interview.pushUserAnswer(form.answer);

    try {
      const response = await apiClient.request<{
        evaluation: {
          score: number;
          feedback: string;
        };
        nextQuestion: {
          question: string;
          topic: string;
        };
      }>(`/interviews/sessions/${interview.sessionId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          question: interview.currentQuestion,
          topic: interview.currentTopic,
          answer: form.answer
        })
      });

      interview.pushEvaluation({
        feedback: response.evaluation.feedback,
        score: response.evaluation.score,
        nextQuestion: response.nextQuestion.question,
        topic: response.nextQuestion.topic
      });
      setForm((state) => ({ ...state, answer: "" }));
      await loadHistory();
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Unable to submit answer");
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async () => {
    if (!interview.sessionId) {
      setError("Start a session first.");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await apiClient.request<{ summary: { overallFeedback: string } }>(
        `/interviews/sessions/${interview.sessionId}/complete`,
        { method: "POST" },
      );

      setCompletion(response.summary.overallFeedback);
      interview.reset();
      await loadHistory();
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Unable to complete session");
    } finally {
      setLoading(false);
    }
  };

  const saveForLater = async () => {
    if (!interview.sessionId) {
      setError("Start a session first.");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await apiClient.request(`/interviews/sessions/${interview.sessionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "paused" })
      });
      setCompletion("Session saved. You can resume this interview later from the backend session state.");
      interview.reset();
      await loadHistory();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save session");
    } finally {
      setLoading(false);
    }
  };

  const openHistorySession = async (session: InterviewHistoryItem) => {
    try {
      setLoading(true);
      setError(undefined);
      setCompletion(undefined);
      setInsight(undefined);

      const response = await apiClient.request<{
        session: {
          _id?: string;
          id?: string;
          status: "active" | "paused" | "completed";
          pendingQuestion?: string;
          pendingTopic?: string;
          pendingWhyThisMatters?: string;
          summary?: { overallFeedback?: string };
        };
        interactions: Array<{
          _id?: string;
          question: string;
          answer: string;
          topic: string;
          score: number;
          feedback: string;
        }>;
      }>(`/interviews/sessions/${session.id}`);

      const messages = response.interactions.flatMap((interaction) => [
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          text: interaction.question,
          meta: `Topic: ${interaction.topic}`
        },
        {
          id: crypto.randomUUID(),
          role: "user" as const,
          text: interaction.answer
        },
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          text: interaction.feedback,
          meta: `Score: ${interaction.score}/10`
        }
      ]);

      if (response.session.pendingQuestion) {
        messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.session.pendingQuestion,
          meta:
            response.session.pendingWhyThisMatters ??
            `Next topic focus: ${response.session.pendingTopic ?? session.topics[0]}`
        });
      }

      interview.hydrateSession({
        sessionId: session.id,
        messages,
        currentQuestion: session.resumable ? response.session.pendingQuestion : undefined,
        currentTopic: session.resumable ? response.session.pendingTopic : undefined,
        status: response.session.status
      });

      if (session.resumable && response.session.status === "paused") {
        await apiClient.request(`/interviews/sessions/${session.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "active" })
        });
      }

      if (!session.resumable && response.session.summary?.overallFeedback) {
        setCompletion(response.session.summary.overallFeedback);
      }

      setHistoryOpen(false);

      await loadHistory();
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : "Unable to load interview history");
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingResume(true);
    setError(undefined);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await apiClient.request<{ text: string; filename: string }>("/interviews/resume/extract", {
        method: "POST",
        body: formData
      });

      setForm((state) => ({ ...state, resumeText: response.text }));
      setResumeFileName(response.filename);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to extract resume text");
    } finally {
      setUploadingResume(false);
      event.target.value = "";
    }
  };

  const stopVoiceCapture = async () => {
    speechRecognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVoiceListening(false);
    setVoiceStatus("Finalizing transcript...");
  };

  const startVoiceCapture = async () => {
    setError(undefined);
    voiceSeedRef.current = form.answer.trim();
    setVoiceStatus(speechSupported ? "Listening..." : "Recording audio...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioBlob.size === 0) {
          setVoiceStatus(undefined);
          return;
        }

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "voice.webm");
          const response = await apiClient.request<{ text: string }>("/interviews/transcribe", {
            method: "POST",
            body: formData
          });

          if (response.text) {
            const prefix = voiceSeedRef.current ? `${voiceSeedRef.current} ` : "";
            setForm((state) => ({ ...state, answer: `${prefix}${response.text}`.trim() }));
          }
          setVoiceStatus(undefined);
        } catch (transcriptionError) {
          setVoiceStatus(undefined);
          setError(
            transcriptionError instanceof Error ? transcriptionError.message : "Unable to transcribe recorded audio",
          );
        }
      };
      recorder.start();

      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        speechRecognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          let transcript = "";

          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            transcript += event.results[index][0].transcript;
          }

          const prefix = voiceSeedRef.current ? `${voiceSeedRef.current} ` : "";
          setForm((state) => ({ ...state, answer: `${prefix}${transcript}`.trim() }));
        };
        recognition.onerror = (event) => {
          setError(`Voice recognition error: ${event.error}`);
        };
        recognition.start();
      }

      setVoiceListening(true);
    } catch (voiceError) {
      setVoiceStatus(undefined);
      setError(voiceError instanceof Error ? voiceError.message : "Unable to access microphone");
    }
  };

  const toggleVoiceCapture = async () => {
    if (voiceListening) {
      await stopVoiceCapture();
      return;
    }

    await startVoiceCapture();
  };

  return (
    <div className={historyOpen ? "grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]" : "block"}>
      {historyOpen ? (
        <InterviewHistorySidebar
          open={historyOpen}
          sessions={historySessions}
          selectedSessionId={interview.sessionId}
          loading={historyLoading}
          onToggle={() => setHistoryOpen((value) => !value)}
          onSelect={(session) => void openHistorySession(session)}
        />
      ) : null}

      <div className={historyOpen ? "space-y-6 min-w-0" : "space-y-6 w-full"}>
      {!interview.sessionId && !historyOnly ? (
        <div className="glass-card mx-auto max-w-3xl space-y-5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              {mode === "company" ? "Company-specific interview" : "Role-based mock interview"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Configure your session</h2>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <Input value={form.role} onChange={(event) => setForm((state) => ({ ...state, role: event.target.value }))} />
          <Input
            value={form.topics}
            onChange={(event) => setForm((state) => ({ ...state, topics: event.target.value }))}
            placeholder="Topics separated by commas"
          />
          <select
            value={form.category}
            onChange={(event) => setForm((state) => ({ ...state, category: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="technical">Technical</option>
            <option value="management">Management</option>
            <option value="general">General</option>
          </select>

          {mode === "company" ? (
            <select
              value={form.company}
              onChange={(event) => setForm((state) => ({ ...state, company: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              {companyOptions.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Adaptive coaching</p>
            <p className="mt-2 text-sm text-slate-300">
              The engine automatically raises difficulty for stronger topics and redirects weak spots into the next prompts.
            </p>
          </div>

          <Textarea
            placeholder="Optional: paste resume highlights, projects, internships, or achievements for resume-based questions..."
            value={form.resumeText}
            onChange={(event) => setForm((state) => ({ ...state, resumeText: event.target.value }))}
            className="min-h-28"
          />
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Optional resume upload</p>
                <p className="mt-1 text-xs text-slate-400">
                  Upload PDF, DOCX, TXT, PNG, JPG, or WEBP. OCR will extract text for resume-based questions.
                </p>
                {resumeFileName ? <p className="mt-2 text-xs text-cyan-200">Loaded: {resumeFileName}</p> : null}
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15">
                <input type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" className="hidden" onChange={uploadResume} />
                {uploadingResume ? "Extracting..." : "Upload resume"}
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={startSession} disabled={loading} className="w-full">
              {loading ? "Preparing session..." : "Start practice"}
            </Button>
          </div>
        </div>
      ) : interview.sessionId ? (
        <ChatWindow
          banner={
            <div className="space-y-3">
              {insight ? (
                <div className="rounded-3xl border border-amber-300/15 bg-amber-300/10 p-4 text-sm text-amber-50">
                  {insight}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
              {completion ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  {completion}
                </div>
              ) : null}
            </div>
          }
          footer={
            <div className="space-y-4">
              <Textarea
                placeholder={
                  interview.status === "completed"
                    ? "This interview session has ended. Start or continue another session to answer."
                    : "Write your answer after the question appears..."
                }
                value={form.answer}
                onChange={(event) => setForm((state) => ({ ...state, answer: event.target.value }))}
                disabled={interview.status === "completed"}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceCapture}
                  disabled={interview.status === "completed"}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition ${
                    voiceListening
                      ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
                      : "border-white/10 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {voiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {voiceListening ? "Stop voice input" : "Use voice input"}
                </button>
                <p className="text-xs text-slate-400">
                  {voiceStatus ?? (speechSupported
                    ? "Live transcript appears while speaking; final text is refined with Whisper-compatible transcription."
                    : "Browser live speech recognition is unavailable, but recorded audio will still be transcribed after you stop.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={submitAnswer} disabled={loading || !interview.sessionId || interview.status === "completed"}>
                  Submit answer
                </Button>
                <Button
                  onClick={saveForLater}
                  disabled={loading || !interview.sessionId || interview.status === "completed"}
                  className="bg-white/10 bg-none"
                >
                  Save session
                </Button>
                <Button
                  onClick={completeSession}
                  disabled={loading || !interview.sessionId || interview.status === "completed"}
                  className="bg-white/10 bg-none"
                >
                  End session
                </Button>
              </div>
            </div>
          }
        />
      ) : (
        <div className="glass-card mx-auto flex min-h-[520px] max-w-4xl flex-col items-center justify-center p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Interview history</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Select a saved conversation</h2>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Open any previous interview from the history drawer to review the full conversation. Sessions that were
            saved but not ended can be continued. Completed sessions stay read-only.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
