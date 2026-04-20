import bcrypt from "bcryptjs";

import { connectDatabase } from "../config/db.js";
import { ActivityModel } from "../models/Activity.js";
import { InteractionModel } from "../models/Interaction.js";
import { PerformanceModel } from "../models/Performance.js";
import { SessionModel } from "../models/Session.js";
import { UserModel } from "../models/User.js";

const demoEmail = "demo@interviewcoach.ai";

const topicProfiles = [
  { topic: "DSA", scores: [6.1, 6.5, 7.0, 7.6, 8.1] },
  { topic: "DBMS", scores: [7.2, 7.4, 7.1, 7.8, 8.0] },
  { topic: "OS", scores: [5.8, 6.0, 6.3, 6.7, 7.0] },
  { topic: "System Design", scores: [5.2, 5.8, 6.4, 6.9, 7.5] },
  { topic: "HR", scores: [7.6, 7.8, 8.0, 8.4, 8.7] }
];

const dateShift = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const formatDay = (date: Date) => date.toISOString().slice(0, 10);

async function seed() {
  await connectDatabase();

  await Promise.all([
    ActivityModel.deleteMany({}),
    InteractionModel.deleteMany({}),
    PerformanceModel.deleteMany({}),
    SessionModel.deleteMany({}),
    UserModel.deleteMany({ email: demoEmail })
  ]);

  const passwordHash = await bcrypt.hash("DemoPass123", 10);

  const user = await UserModel.create({
    name: "Aarav Sharma",
    email: demoEmail,
    passwordHash,
    targetRole: "Full-Stack Engineer",
    readinessScore: 78,
    preferences: {
      preferredCategories: ["technical", "general"],
      targetCompanies: ["Google", "Amazon", "Microsoft"]
    },
    memorySpace: {
      interviewHistoryIds: [],
      aiInsights: [
        "System Design is improving quickly after repeated architecture-focused sessions.",
        "Communication remains a strong area during HR rounds."
      ]
    }
  });

  const createdSessionIds: string[] = [];

  for (let index = 0; index < 6; index += 1) {
    const startedAt = dateShift(10 - index * 2);
    const topics = index % 2 === 0 ? ["DSA", "System Design"] : ["DBMS", "OS"];
    const averageScore = Number((6.2 + index * 0.35).toFixed(1));
    const company = index % 3 === 0 ? "Google" : index % 3 === 1 ? "Amazon" : undefined;

    const session = await SessionModel.create({
      userId: user._id,
      mode: company ? "company" : "mock",
      role: user.targetRole,
      company,
      resumeText:
        "Built a placement prep portal, optimized a Node.js API, and led a college team project for real-time analytics.",
      topics,
      category: "technical",
      status: "completed",
      averageScore,
      adaptiveDifficulty: Math.min(5, 2 + index),
      startedAt,
      endedAt: new Date(startedAt.getTime() + 45 * 60 * 1000),
      summary: {
        mistakes: ["Missed some edge cases under time pressure"],
        weakTopics: index < 3 ? ["System Design"] : ["OS"],
        strengths: ["Structured explanations", "Good trade-off awareness"],
        correctAnswers: ["Answered core concept questions accurately"],
        dos: ["Use concrete project examples", "Mention scale and metrics"],
        donts: ["Avoid vague architecture descriptions"],
        overallFeedback: "Good progress overall. Keep tightening technical depth and system-level reasoning."
      }
    });

    createdSessionIds.push(session.id);

    const interactions = topics.map((topic, topicIndex) => ({
      sessionId: session._id,
      userId: user._id,
      topic,
      question:
        topic === "System Design"
          ? "Design a scalable interview analytics dashboard for thousands of active users."
          : `Explain a practical ${topic} problem you solved in a project or interview scenario.`,
      answer:
        topic === "System Design"
          ? "I would start with modular services, event-driven tracking, and caching for dashboard reads."
          : `I would explain the core ${topic} concept, a real project use case, and trade-offs.`,
      score: Number((averageScore + topicIndex * 0.4).toFixed(1)),
      correctness: "Mostly correct with room for more depth.",
      missingPoints: ["Could mention edge cases", "Could connect more strongly to scale"],
      conceptClarity: "Clear but slightly high level.",
      suggestedImprovements: ["Add metrics", "Reference production trade-offs"],
      feedback: `Solid ${topic} foundation. Push deeper into implementation details and decision trade-offs.`,
      createdAt: new Date(startedAt.getTime() + (topicIndex + 1) * 12 * 60 * 1000),
      updatedAt: new Date(startedAt.getTime() + (topicIndex + 1) * 12 * 60 * 1000)
    }));

    await InteractionModel.insertMany(interactions);
  }

  await UserModel.findByIdAndUpdate(user._id, {
    $set: {
      "memorySpace.interviewHistoryIds": createdSessionIds
    }
  });

  const activityDocs = Array.from({ length: 28 }, (_, idx) => {
    const date = formatDay(dateShift(27 - idx));
    const sessionsCount = idx % 6 === 0 ? 0 : (idx % 3) + 1;
    const activeHours = sessionsCount === 0 ? 0 : Number((sessionsCount * 0.8).toFixed(1));
    const studied = sessionsCount === 0 ? [] : topicProfiles.slice(0, sessionsCount + 1).map((entry) => entry.topic);

    return {
      userId: user._id,
      date,
      activeHours,
      sessionsCount,
      topicsStudied: studied,
      scores: studied.map((_, scoreIndex) => Number((6 + ((idx + scoreIndex) % 4) * 0.7).toFixed(1))),
      feedbackHighlights:
        sessionsCount === 0
          ? []
          : ["Sharper explanation structure", "More confidence in follow-up questions", "Improved trade-off reasoning"].slice(
              0,
              sessionsCount,
            )
    };
  });

  await ActivityModel.insertMany(activityDocs);

  for (const profile of topicProfiles) {
    await PerformanceModel.create({
      userId: user._id,
      topic: profile.topic,
      scoreHistory: profile.scores.map((score, idx) => ({
        date: formatDay(dateShift((profile.scores.length - idx) * 4)),
        score
      }))
    });
  }

  console.log("Demo analytics data seeded successfully.");
  console.log(`Login email: ${demoEmail}`);
  console.log("Login password: DemoPass123");
}

void seed();
