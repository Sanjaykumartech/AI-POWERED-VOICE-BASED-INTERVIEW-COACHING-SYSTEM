import { AnalyticsService } from "../services/analytics.service.js";
import { asyncHandler } from "../utils/async-handler.js";

const analyticsService = new AnalyticsService();

export const dashboardController = asyncHandler(async (request, response) => {
  const dashboard = await analyticsService.getDashboard(request.user!.userId);
  response.json(dashboard);
});

