"use client";

import type { CandidateDetails, DashboardPayload } from "@ai-interview/shared";
import { useEffect, useState } from "react";
import { LogOut, Monitor, Moon, ShieldCheck, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProfileSummary } from "@/components/profile/profile-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useAuthStore } from "@/store/auth-store";

interface AuthSession {
  id: string;
  tokenId: string;
  deviceLabel: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

interface SecurityProfile {
  email: string;
  passwordChangedAt?: string;
  emailChangedAt?: string;
}

const formatLastChanged = (value?: string) => {
  if (!value) {
    return "Recently";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const candidateDetailsToForm = (details?: CandidateDetails) => ({
  educationQualification: details?.educationQualification ?? "",
  institution: details?.institution ?? "",
  fieldOfStudy: details?.fieldOfStudy ?? "",
  stream: details?.stream ?? "",
  department: details?.department ?? "",
  skills: details?.skills?.join(", ") ?? "",
  workExperience: details?.workExperience ?? "",
  internshipRole: details?.internshipRole ?? "",
  experienceDuration: details?.experienceDuration ?? "",
  preparingFor: details?.preparingFor ?? ""
});

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [accountMessage, setAccountMessage] = useState<string>();
  const [accountBusy, setAccountBusy] = useState<string>();
  const [expandedSection, setExpandedSection] = useState<"password" | "email" | "candidate" | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [form, setForm] = useState({
    name: "",
    targetRole: "",
    targetCompanies: ""
  });
  const [candidateForm, setCandidateForm] = useState({
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: ""
  });

  useEffect(() => {
    void apiClient
      .request<DashboardPayload>("/analytics/dashboard")
      .then((response) => {
        setData(response);
        setForm({
          name: response.profile.name,
          targetRole: response.profile.targetRole,
          targetCompanies: response.profile.preferences.targetCompanies.join(", ")
        });
        setCandidateForm(candidateDetailsToForm(response.profile.candidateDetails));
      })
      .catch(console.error);

    void loadSessions();
    void apiClient
      .request<{ user: SecurityProfile }>("/auth/me")
      .then((response) => setSecurityProfile(response.user))
      .catch(console.error);

    setTheme(getStoredTheme());
  }, []);

  const changeTheme = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const loadSessions = async () => {
    try {
      const response = await apiClient.request<{ sessions: AuthSession[] }>("/auth/sessions");
      setSessions(response.sessions);
    } catch (error) {
      console.error(error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(undefined);

    try {
      await apiClient.request("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          targetRole: form.targetRole,
          preferredCategories: data?.profile.preferences.preferredCategories ?? ["technical"],
          targetCompanies: form.targetCompanies.split(",").map((item) => item.trim()).filter(Boolean)
        })
      });

      updateUser({ name: form.name, targetRole: form.targetRole });
      setMessage("Profile updated successfully.");
    } finally {
      setSaving(false);
    }
  };

  const saveCandidateDetails = async () => {
    setSaving(true);
    setMessage(undefined);

    const candidateDetails = {
      educationQualification: candidateForm.educationQualification.trim(),
      institution: candidateForm.institution.trim(),
      fieldOfStudy: candidateForm.fieldOfStudy.trim(),
      stream: candidateForm.stream.trim(),
      department: candidateForm.department.trim(),
      skills: candidateForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      workExperience: candidateForm.workExperience.trim(),
      internshipRole: candidateForm.internshipRole.trim(),
      experienceDuration: candidateForm.experienceDuration.trim(),
      preparingFor: candidateForm.preparingFor.trim()
    };

    try {
      if (!candidateDetails.educationQualification || !candidateDetails.fieldOfStudy || candidateDetails.skills.length === 0) {
        setMessage("Education, field of study, and at least one skill are required.");
        return;
      }

      const response = await apiClient.request<{ user: any }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          targetRole: form.targetRole,
          candidateDetails
        })
      });

      updateUser(response.user);
      setData((state) =>
        state
          ? {
              ...state,
              profile: {
                ...state.profile,
                targetRole: response.user.targetRole,
                candidateProfileCompleted: true,
                candidateDetails: response.user.candidateDetails
              }
            }
          : state,
      );
      setMessage("Candidate details updated successfully.");
      setExpandedSection(null);
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setAccountBusy(sessionId);
      setAccountMessage(undefined);
      await apiClient.request(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      setAccountMessage("Selected device has been logged out.");
      await loadSessions();
    } finally {
      setAccountBusy(undefined);
    }
  };

  const changePassword = async () => {
    try {
      setAccountBusy("password");
      setAccountMessage(undefined);
      await apiClient.request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(passwordForm)
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setSecurityProfile((state) => ({
        email: state?.email ?? data?.profile.email ?? "",
        emailChangedAt: state?.emailChangedAt,
        passwordChangedAt: new Date().toISOString()
      }));
      setAccountMessage("Password updated successfully.");
      setExpandedSection(null);
    } finally {
      setAccountBusy(undefined);
    }
  };

  const changeEmail = async () => {
    try {
      setAccountBusy("email");
      setAccountMessage(undefined);
      const response = await apiClient.request<{ user: { email: string } }>("/auth/change-email", {
        method: "POST",
        body: JSON.stringify(emailForm)
      });
      updateUser({ email: response.user.email });
      setSecurityProfile({
        email: response.user.email,
        emailChangedAt: new Date().toISOString(),
        passwordChangedAt: securityProfile?.passwordChangedAt
      });
      setEmailForm({ currentPassword: "", newEmail: "" });
      setAccountMessage("Email updated successfully.");
      setExpandedSection(null);
    } finally {
      setAccountBusy(undefined);
    }
  };

  const logoutCurrentDevice = async () => {
    try {
      setAccountBusy("logout");
      await apiClient.request("/auth/logout", { method: "POST" });
    } finally {
      logout();
      router.push("/login");
    }
  };

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ProfileSummary profile={data.profile} />
      <div className="glass-card p-6">
        <h3 className="text-2xl font-semibold text-white">Edit Profile</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
          <Input
            value={form.targetRole}
            onChange={(event) => setForm((state) => ({ ...state, targetRole: event.target.value }))}
          />
          <div className="md:col-span-2">
            <Input
              value={form.targetCompanies}
              onChange={(event) => setForm((state) => ({ ...state, targetCompanies: event.target.value }))}
              placeholder="Comma-separated target companies"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-400">Total sessions</p>
          <p className="mt-2 text-3xl font-semibold text-white">{data.stats.totalSessions}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-400">Total hours practiced</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {data.heatmap.reduce((sum, cell) => sum + cell.activeHours, 0).toFixed(1)}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-400">Preferences</p>
          <p className="mt-2 text-sm text-slate-200">
            Companies: {data.profile.preferences.targetCompanies.join(", ") || "Not set"}
          </p>
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Candidate Details</h3>
            <p className="mt-2 text-sm text-slate-400">
              Education, skills, experience, and preparation goals used for personalized interview coaching.
            </p>
            {data.profile.candidateDetails ? (
              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <p>Education: {data.profile.candidateDetails.educationQualification || "Not set"}</p>
                <p>Field: {data.profile.candidateDetails.fieldOfStudy || "Not set"}</p>
                <p>Department: {data.profile.candidateDetails.department || data.profile.candidateDetails.stream || "Not set"}</p>
                <p>Skills: {data.profile.candidateDetails.skills?.join(", ") || "Not set"}</p>
                <p className="md:col-span-2">Preparing for: {data.profile.candidateDetails.preparingFor || "Not set"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-50">Candidate details are not completed yet.</p>
            )}
          </div>
          <Button type="button" onClick={() => setExpandedSection(expandedSection === "candidate" ? null : "candidate")}>
            {expandedSection === "candidate" ? "Close" : "Edit details"}
          </Button>
        </div>

        {expandedSection === "candidate" ? (
          <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Education qualification, school, degree, or diploma"
                value={candidateForm.educationQualification}
                onChange={(event) => setCandidateForm((state) => ({ ...state, educationQualification: event.target.value }))}
              />
              <Input
                placeholder="Institution / college / school"
                value={candidateForm.institution}
                onChange={(event) => setCandidateForm((state) => ({ ...state, institution: event.target.value }))}
              />
              <Input
                placeholder="Field of study"
                value={candidateForm.fieldOfStudy}
                onChange={(event) => setCandidateForm((state) => ({ ...state, fieldOfStudy: event.target.value }))}
              />
              <Input
                placeholder="Stream"
                value={candidateForm.stream}
                onChange={(event) => setCandidateForm((state) => ({ ...state, stream: event.target.value }))}
              />
              <Input
                placeholder="Department completed graduation"
                value={candidateForm.department}
                onChange={(event) => setCandidateForm((state) => ({ ...state, department: event.target.value }))}
              />
              <Input
                placeholder="Skills, comma separated"
                value={candidateForm.skills}
                onChange={(event) => setCandidateForm((state) => ({ ...state, skills: event.target.value }))}
              />
              <Input
                placeholder="Internship/work role, if any"
                value={candidateForm.internshipRole}
                onChange={(event) => setCandidateForm((state) => ({ ...state, internshipRole: event.target.value }))}
              />
              <Input
                placeholder="Experience duration, e.g. 6 months"
                value={candidateForm.experienceDuration}
                onChange={(event) => setCandidateForm((state) => ({ ...state, experienceDuration: event.target.value }))}
              />
            </div>
            <Textarea
              placeholder="Work experience or internships: company, role, responsibilities, and projects"
              value={candidateForm.workExperience}
              onChange={(event) => setCandidateForm((state) => ({ ...state, workExperience: event.target.value }))}
              className="min-h-24"
            />
            <Textarea
              placeholder="Now what are you preparing for? Mention role, companies, exams, or interview type"
              value={candidateForm.preparingFor}
              onChange={(event) => setCandidateForm((state) => ({ ...state, preparingFor: event.target.value }))}
              className="min-h-24"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={saveCandidateDetails} disabled={saving}>
                {saving ? "Saving..." : "Save candidate details"}
              </Button>
              <Button type="button" onClick={() => setExpandedSection(null)} className="bg-white/10 text-white hover:bg-white/15">
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">Theme</h3>
            <p className="mt-2 text-sm text-slate-400">Choose light, dark, or follow your system preference.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => changeTheme("light")}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              theme === "light" ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4 text-amber-300" />
              <div>
                <p className="text-sm font-medium text-white">Light</p>
                <p className="text-xs text-slate-400">Sun theme</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => changeTheme("dark")}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              theme === "dark" ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-cyan-200" />
              <div>
                <p className="text-sm font-medium text-white">Dark</p>
                <p className="text-xs text-slate-400">Moon theme</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => changeTheme("system")}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              theme === "system" ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-violet-200" />
              <div>
                <p className="text-sm font-medium text-white">System</p>
                <p className="text-xs text-slate-400">Follow device setting</p>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">Manage Account</h3>
              <p className="mt-2 text-sm text-slate-400">
                Review logged in devices, revoke suspicious sessions, and secure your account.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                      <Monitor className="h-4 w-4 text-cyan-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{session.deviceLabel}</p>
                        {session.current ? (
                          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-200">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{session.userAgent}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Last active {new Date(session.lastActiveAt).toLocaleString()} | IP {session.ipAddress || "Unknown"}
                      </p>
                    </div>
                  </div>
                  {!session.current ? (
                    <Button
                      onClick={() => void revokeSession(session.id)}
                      disabled={accountBusy === session.id}
                      className="md:min-w-[160px]"
                    >
                      {accountBusy === session.id ? "Logging out..." : "Logout this device"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Password</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Last changed {formatLastChanged(securityProfile?.passwordChangedAt)}
                </p>
              </div>
              <Button type="button" onClick={() => setExpandedSection(expandedSection === "password" ? null : "password")}>
                Change
              </Button>
            </div>
            {expandedSection === "password" ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((state) => ({ ...state, currentPassword: event.target.value }))}
                  placeholder="Verify with current password"
                />
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((state) => ({ ...state, newPassword: event.target.value }))}
                  placeholder="New password"
                />
                <div className="flex gap-3">
                  <Button onClick={changePassword} disabled={accountBusy === "password"}>
                    {accountBusy === "password" ? "Updating..." : "Update password"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setExpandedSection(null)}
                    className="bg-white/10 text-white hover:bg-white/15"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Email</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {securityProfile?.email ?? data.profile.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Last changed {formatLastChanged(securityProfile?.emailChangedAt)}
                </p>
              </div>
              <Button type="button" onClick={() => setExpandedSection(expandedSection === "email" ? null : "email")}>
                Change
              </Button>
            </div>
            {expandedSection === "email" ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Input
                  type="password"
                  value={emailForm.currentPassword}
                  onChange={(event) => setEmailForm((state) => ({ ...state, currentPassword: event.target.value }))}
                  placeholder="Verify with current password"
                />
                <Input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(event) => setEmailForm((state) => ({ ...state, newEmail: event.target.value }))}
                  placeholder="New email address"
                />
                <div className="flex gap-3">
                  <Button onClick={changeEmail} disabled={accountBusy === "email"}>
                    {accountBusy === "email" ? "Updating..." : "Update email"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setExpandedSection(null)}
                    className="bg-white/10 text-white hover:bg-white/15"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">Current Device</h3>
            <p className="mt-2 text-sm text-slate-400">
              Sign out from this browser if you are done or suspect someone else is using it.
            </p>
            <Button onClick={logoutCurrentDevice} disabled={accountBusy === "logout"} className="mt-4">
              <LogOut className="mr-2 h-4 w-4" />
              {accountBusy === "logout" ? "Logging out..." : "Logout"}
            </Button>
            {accountMessage ? <p className="mt-4 text-sm text-emerald-200">{accountMessage}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
