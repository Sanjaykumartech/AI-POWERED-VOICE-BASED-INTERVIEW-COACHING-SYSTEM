export const buildQuestionGenerationPrompt = ({
  role,
  topics,
  category,
  company,
  difficulty,
  weaknessHint,
  resumeText,
  sessionHistory
}: {
  role: string;
  topics: string[];
  category: string;
  company?: string;
  difficulty: number;
  weaknessHint?: string;
  resumeText?: string;
  sessionHistory?: Array<{
    question: string;
    answer: string;
    topic: string;
    score?: number;
    feedback?: string;
  }>;
}) => {
  const formattedHistory = sessionHistory?.length
    ? sessionHistory
        .map(
          (item, index) => `
Question ${index + 1}: ${item.question}
Candidate answer ${index + 1}: ${item.answer}
Topic ${index + 1}: ${item.topic}
Score ${index + 1}: ${item.score ?? "N/A"}
Feedback ${index + 1}: ${item.feedback ?? "N/A"}
`.trim(),
        )
        .join("\n\n")
    : "No prior questions in this session. This is the first question.";

  return `
You are an elite interview coach.
Generate exactly one interview question in JSON.

Context:
- Candidate target role: ${role}
- Category: ${category}
- Topics: ${topics.join(", ")}
- Company style: ${company ?? "General role-based interview"}
- Difficulty: ${difficulty}/5
- Known weakness focus: ${weaknessHint ?? "None"}
- Resume context: ${resumeText?.trim() ? resumeText : "Not provided"}
- Session history so far:
${formattedHistory}

Instructions:
- If resume context is provided, tailor the question to the candidate's projects, skills, achievements, or experience.
- Prefer asking the candidate to explain trade-offs, impact, architecture, ownership, or problem-solving from their own work.
- Keep the question realistic for an actual interview and anchored to one of the provided topics.
- If this is the first question, do not ask a generic textbook question. Anchor it to the role, selected topics, and resume/project context when available.
- If there is session history, do not repeat or paraphrase any previous question.
- Use the prior answers, scores, and feedback to adapt the next question difficulty:
  - low score: ask a narrower follow-up or simpler applied question on the weak area
  - medium score: ask for deeper reasoning, trade-offs, or implementation detail
  - high score: increase difficulty and explore adjacent practical scenarios
- Prefer concrete, interview-quality prompts over generic "Explain X" wording.
- Never reuse any earlier question stem, opening phrase, or scenario from the session history.
- If the previous answer was weak, ask a different but related question that helps diagnose the gap instead of repeating the same ask.

Return JSON only:
{
  "question": "string",
  "topic": "string",
  "whyThisMatters": "string"
}
`.trim();
};

export const buildAnswerEvaluationPrompt = ({
  question,
  answer,
  topic,
  role,
  company
}: {
  question: string;
  answer: string;
  topic: string;
  role: string;
  company?: string;
}) => `
You are a senior technical interviewer and evaluator.
Evaluate the candidate answer for a ${role} interview${company ? ` at ${company}` : ""}.

Question:
${question}

Topic:
${topic}

Candidate answer:
${answer}

Return JSON only:
{
  "score": 0,
  "correctness": "short paragraph",
  "missingPoints": ["point"],
  "conceptClarity": "short paragraph",
  "suggestedImprovements": ["improvement"],
  "feedback": "coaching paragraph"
}
`.trim();

export const buildSessionSummaryPrompt = ({
  role,
  topics,
  transcript
}: {
  role: string;
  topics: string[];
  transcript: Array<{ question: string; answer: string; score: number; feedback: string }>;
}) => `
You are an AI interview coach. Summarize this completed interview session.

Role:
${role}

Topics:
${topics.join(", ")}

Transcript:
${JSON.stringify(transcript)}

Return JSON only:
{
  "mistakes": ["string"],
  "weakTopics": ["string"],
  "strengths": ["string"],
  "correctAnswers": ["string"],
  "dos": ["string"],
  "donts": ["string"],
  "overallFeedback": "string"
}
`.trim();
