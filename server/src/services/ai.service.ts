import { env } from "../config/env.js";
import { openaiClient } from "../lib/openai.js";
import {
  buildAnswerEvaluationPrompt,
  buildQuestionGenerationPrompt,
  buildSessionSummaryPrompt
} from "../prompts/interview-prompts.js";

const parseJson = <T>(content: string, fallback: T): T => {
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
};

const logAiFallback = (operation: string, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown AI provider error";
  console.error(`[AI:${operation}] Falling back to local default.`, message);
};

export class AiService {
  private preferredModels = [
    env.OPENAI_MODEL,
    "gpt-4.1-nano",
    "gemini-2.5-flash",
    "nova-micro"
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  private normalizeQuestion(question: string) {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private isDuplicateQuestion(
    question: string,
    sessionHistory?: Array<{ question: string }>,
  ) {
    const normalizedQuestion = this.normalizeQuestion(question);
    return (
      sessionHistory?.some((item) => this.normalizeQuestion(item.question) === normalizedQuestion) ?? false
    );
  }

  private buildNonRepeatingFallback(input: {
    role: string;
    topics: string[];
    weaknessHint?: string;
    resumeText?: string;
    sessionHistory?: Array<{
      question: string;
      answer: string;
      topic: string;
      score?: number;
      feedback?: string;
    }>;
  }) {
    const currentFocusTopic = input.weaknessHint && input.topics.includes(input.weaknessHint)
      ? input.weaknessHint
      : input.topics[0];
    const historyCount = input.sessionHistory?.length ?? 0;
    const lastTurn = input.sessionHistory?.at(-1);

    if (historyCount === 0) {
      return {
        question: input.resumeText?.trim()
          ? `Pick one project from your resume and explain a specific ${currentFocusTopic} decision you made, why you chose that approach, and what production trade-off you had to manage as a ${input.role}.`
          : `Describe a production ${input.role} feature where ${currentFocusTopic} directly affected performance, scalability, or user experience, and explain how you would design it.`,
        topic: currentFocusTopic,
        whyThisMatters:
          "This question checks whether you can connect the chosen topic to realistic engineering decisions in production systems."
      };
    }

    if ((lastTurn?.score ?? 0) <= 4) {
      return {
        question: `Your last answer showed a gap in ${currentFocusTopic}. Walk through a smaller, concrete ${input.role} use case where ${currentFocusTopic} helps solve one specific bottleneck, and explain the implementation step by step.`,
        topic: currentFocusTopic,
        whyThisMatters:
          "This follow-up narrows the scope to confirm core understanding before increasing difficulty."
      };
    }

    return {
      question: input.resumeText?.trim()
        ? `Staying within your resume experience, describe a different scenario where ${currentFocusTopic} influenced architecture or scale, and explain what you would measure, optimize, and revisit after launch.`
        : `Give a different real-world ${input.role} scenario from your earlier answer where ${currentFocusTopic} matters, and compare two implementation approaches with their trade-offs.`,
      topic: currentFocusTopic,
      whyThisMatters:
        "This follow-up pushes beyond the previous response and checks whether you can adapt the concept to a distinct scenario."
    };
  }

  private extractJsonBlock(content: string) {
    const trimmed = content.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed;
    }

    const match = trimmed.match(/\{[\s\S]*\}/);
    return match ? match[0] : trimmed;
  }

  private async requestStructuredJson<T>(operation: string, prompt: string, fallback: T) {
    if (!openaiClient) {
      return fallback;
    }

    let lastError: unknown;

    for (const model of this.preferredModels) {
      try {
        const response = await openaiClient.responses.create({
          model,
          input: prompt
        });

        const content = this.extractJsonBlock(response.output_text ?? "");
        return parseJson(content, fallback);
      } catch (responsesError) {
        const responsesMessage =
          responsesError instanceof Error ? responsesError.message : "Unknown responses API error";
        console.warn(`[AI:${operation}] responses.create failed for ${model}. Trying chat.completions.`, responsesMessage);

        try {
          const completion = await openaiClient.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content: "Return only valid JSON matching the user's requested schema."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          });

          const content = this.extractJsonBlock(completion.choices[0]?.message?.content ?? "");
          return parseJson(content, fallback);
        } catch (chatError) {
          lastError = chatError;
          const chatMessage = chatError instanceof Error ? chatError.message : "Unknown chat API error";
          console.warn(`[AI:${operation}] chat.completions failed for ${model}.`, chatMessage);
        }
      }
    }

    logAiFallback(operation, lastError);
    return fallback;
  }

  async generateQuestion(input: {
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
  }) {
    const fallback = this.buildNonRepeatingFallback(input);

    if (!openaiClient) {
      return fallback;
    }

    const basePrompt = buildQuestionGenerationPrompt(input);
    const generated = await this.requestStructuredJson("generateQuestion", basePrompt, fallback);

    if (!this.isDuplicateQuestion(generated.question, input.sessionHistory)) {
      return generated;
    }

    const retryPrompt = `${basePrompt}

The previously generated question was too similar to an earlier question in this same session.
Generate a substantially different question now.
Constraints:
- Different opening phrase
- Different scenario
- Different angle of evaluation
- Still relevant to the role, topic, resume, and prior performance
Return JSON only.`.trim();

    const regenerated = await this.requestStructuredJson("generateQuestionRetry", retryPrompt, fallback);
    if (!this.isDuplicateQuestion(regenerated.question, input.sessionHistory)) {
      return regenerated;
    }

    return fallback;
  }

  async evaluateAnswer(input: {
    question: string;
    answer: string;
    topic: string;
    role: string;
    company?: string;
  }) {
    const fallback = {
      score: 7,
      correctness: "The answer is partially correct and demonstrates reasonable understanding.",
      missingPoints: ["Add a more concrete example", "Clarify trade-offs more explicitly"],
      conceptClarity: "The explanation is understandable but could be more structured.",
      suggestedImprovements: ["Use a clearer step-by-step structure", "Mention edge cases and trade-offs"],
      feedback: "Good foundation. Tighten your explanation with examples, trade-offs, and implementation detail."
    };

    if (!openaiClient) {
      return fallback;
    }

    return this.requestStructuredJson("evaluateAnswer", buildAnswerEvaluationPrompt(input), fallback);
  }

  async summarizeSession(input: {
    role: string;
    topics: string[];
    transcript: Array<{ question: string; answer: string; score: number; feedback: string }>;
  }) {
    const fallback = {
      mistakes: ["Some answers lacked depth and specific examples."],
      weakTopics: input.topics.slice(0, 1),
      strengths: ["Shows steady problem-solving intent"],
      correctAnswers: ["Answered core concepts with acceptable accuracy"],
      dos: ["Structure answers with context, action, and result"],
      donts: ["Do not stop at definitions without examples"],
      overallFeedback: "You are progressing well. Focus on precision, examples, and clearer communication."
    };

    if (!openaiClient) {
      return fallback;
    }

    return this.requestStructuredJson("summarizeSession", buildSessionSummaryPrompt(input), fallback);
  }
}
