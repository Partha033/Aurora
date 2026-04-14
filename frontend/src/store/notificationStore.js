import { create } from 'zustand';
import api from '../api/axiosInstance';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pagination: {},
  isOpen: false,

  toggleNotifications: () => set({ isOpen: !get().isOpen }),
  closeNotifications: () => set({ isOpen: false }),
  openNotifications: () => set({ isOpen: true }),

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  fetchNotifications: async (page = 1) => {
    try {
      set({ isLoading: true });
      const { data } = await api.get(`/notification?currentPage=${page}&perPage=10`);
      if (data.success) {
        set({
          notifications: page === 1 ? data.result.rows : [...get().notifications, ...data.result.rows],
          pagination: data.result.pagination,
          unreadCount: data.result.rows.filter(n => !n.isRead).length // This is a bit simplified, usually backend should return unread count
        });
        // Recalculate unread count from all fetched if needed, but better to have it from backend
        const allUnread = data.result.rows.filter(n => !n.isRead).length;
        set({ unreadCount: allUnread });
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const { data } = await api.patch(`/notification/${id}/read`);
      if (data.success) {
        set((state) => ({
          notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const { data } = await api.patch('/notification/read-all');
      if (data.success) {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const { data } = await api.delete(`/notification/${id}`);
      if (data.success) {
        const wasUnread = get().notifications.find(n => n._id === id && !n.isRead);
        set((state) => ({
          notifications: state.notifications.filter(n => n._id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        }));
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  }
}));
