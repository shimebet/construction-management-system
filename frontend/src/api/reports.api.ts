import { costApi } from './cost.api';
import { dashboardApi } from './dashboard.api';
import { financeApi } from './finance.api';
import { projectsApi } from './projects.api';

export const reportsApi = {
  getDashboardReport: async () => {
    return dashboardApi.getStats();
  },

  getProjectReport: async (projectId: number) => {
    const [costSummary, cashFlow] = await Promise.all([
      costApi.getSummary(projectId),
      financeApi.getCashFlow(projectId),
    ]);

    return {
      projectId,
      costSummary,
      cashFlow,
    };
  },

  getProjects: async () => {
    return projectsApi.findAll();
  },
};