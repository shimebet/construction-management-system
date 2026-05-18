import { api } from './client';

export type NotificationItem = {
  id: number;
  userId: number;
  projectId?: number | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  project?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

export const notificationsApi = {
  findMine: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};