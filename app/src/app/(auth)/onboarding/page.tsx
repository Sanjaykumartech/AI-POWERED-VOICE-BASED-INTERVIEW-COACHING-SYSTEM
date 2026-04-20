"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({
    targetRole: user?.targetRole ?? "Software Engineer",
    educationQualification: "",
    institution: "",
    fieldOfStudy: "",
    stream: "",
    department: "",
    skills: "",
    workExperience: "",
    internshipRole: "",
    experienceDuration: "",
    preparingFor: ""
  });

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, router, token]);

  useEffect(() => {
    if (user && !user.requiresCandidateOnboarding) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    const candidateDetails = {
      educationQualification: form.educationQualification.trim(),
      institution: form.institution.trim(),
      fieldOfStudy: form.fieldOfStudy.trim(),
      stream: form.stream.trim(),
      department: form.department.trim(),
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      workExperience: form.workExperience.trim(),
      internshipRole: form.internshipRole.trim(),
      experienceDuration: form.experienceDuration.trim(),
      preparingFor: form.preparingFor.trim()
    };

    try {
      if (!form.targetRole.trim()) {
        throw new Error("Target role is required");
      }

      if (!candidateDetails.educationQualification) {
        throw new Error("Education qualification is required");
      }

      if (!candidateDetails.fieldOfStudy) {
        throw new Error("Field or stream is required");
      }

      if (candidateDetails.skills.length === 0) {
        throw new Error("Add at least one skill");
      }

      if (!candidateDetails.preparingFor) {
        throw new Error("Tell us what you are preparing for");
      }

      const response = await apiClient.request<{ user: any }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          targetRole: form.targetRole.trim(),
          candidateDetails
        })
      });

      updateUser(response.user);
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save candidate details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthHydrator />
      <div className="glass-card w-full max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Candidate onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Tell us what you are preparing for</h1>
        <p className="mt-3 text-sm text-slate-300">
          These details help the AI generate questions based on your education, skills, internships, and target role.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Target role"
              value={form.targetRole}
              onChange={(event) => setForm((state) => ({ ...state, targetRole: event.target.value }))}
              required
            />
            <Input
              placeholder="Education qualification, school, degree, or diploma"
              value={form.educationQualification}
              onChange={(event) => setForm((state) => ({ ...state, educationQualification: event.target.value }))}
              required
            />
            <Input
              placeholder="Institution / college / school"
              value={form.institution}
              onChange={(event) => setForm((state) => ({ ...state, institution: event.target.value }))}
            />
            <Input
              placeholder="Field of study"
              value={form.fieldOfStudy}
              onChange={(event) => setForm((state) => ({ ...state, fieldOfStudy: event.target.value }))}
              required
            />
            <Input
              placeholder="Stream"
              value={form.stream}
              onChange={(event) => setForm((state) => ({ ...state, stream: event.target.value }))}
            />
            <Input
              placeholder="Department completed graduation"
              value={form.department}
              onChange={(event) => setForm((state) => ({ ...state, department: event.target.value }))}
            />
            <Input
              placeholder="Skills, comma separated"
              value={form.skills}
              onChange={(event) => setForm((state) => ({ ...state, skills: event.target.value }))}
              required
            />
            <Input
              placeholder="Internship/work role, if any"
              value={form.internshipRole}
              onChange={(event) => setForm((state) => ({ ...state, internshipRole: event.target.value }))}
            />
            <Input
              placeholder="Experience duration, e.g. 6 months"
              value={form.experienceDuration}
              onChange={(event) => setForm((state) => ({ ...state, experienceDuration: event.target.value }))}
            />
          </div>

          <Textarea
            placeholder="Work experience or internships: company, role, responsibilities, and projects"
            value={form.workExperience}
            onChange={(event) => setForm((state) => ({ ...state, workExperience: event.target.value }))}
            className="min-h-24"
          />
          <Textarea
            placeholder="Now what are you preparing for? Mention role, companies, exams, or interview type"
            value={form.preparingFor}
            onChange={(event) => setForm((state) => ({ ...state, preparingFor: event.target.value }))}
            className="min-h-24"
            required
          />

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? "Saving..." : "Save candidate details"}
          </Button>
        </form>
      </div>
    </div>
  );
}
