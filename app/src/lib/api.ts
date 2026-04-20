const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

const extractIssueMessage = (payload: any) => {
  const fieldErrors = payload?.issues?.fieldErrors;

  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return payload?.message ?? "Request failed";
};

export class ApiClient {
  private token?: string;

  setToken(token?: string) {
    this.token = token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Request failed" }));

      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ai-interview-auth-expired"));
      }

      throw new Error(extractIssueMessage(payload));
    }

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
