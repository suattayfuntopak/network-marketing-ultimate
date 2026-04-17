'use client'

import { create } from 'zustand'
import type { User, Contact, Task, Notification, AIRecommendation, PipelineStage } from '@/types'
import { markAllNotificationReadIds, markNotificationReadId } from '@/lib/clientStorage'

function countUnreadNotifications(notifications: Notification[]) {
  return notifications.filter((notification) => !notification.isRead).length
}

interface AppState {
  // User
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Sidebar
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  setSidebarMobileOpen: (open: boolean) => void

  // AI Panel
  aiPanelOpen: boolean
  toggleAIPanel: () => void
  setAIPanelOpen: (open: boolean) => void

  // Search
  searchOpen: boolean
  searchQuery: string
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void

  // Contacts
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  completeTask: (id: string) => void

  // Notifications
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  unreadCount: number

  // AI Recommendations
  aiRecommendations: AIRecommendation[]
  setAIRecommendations: (recs: AIRecommendation[]) => void
  dismissRecommendation: (id: string) => void

  // Filters
  contactFilterStage: PipelineStage | 'all'
  contactFilterTemperature: string
  setContactFilterStage: (stage: PipelineStage | 'all') => void
  setContactFilterTemperature: (temp: string) => void

  // View
  pipelineViewMode: 'kanban' | 'table' | 'calendar'
  setPipelineViewMode: (mode: 'kanban' | 'table' | 'calendar') => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  aiPanelOpen: false,
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAIPanelOpen: (open) => set({ aiPanelOpen: open }),

  searchOpen: false,
  searchQuery: '',
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) => set((s) => ({ contacts: [contact, ...s.contacts] })),
  updateContact: (id, updates) => set((s) => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteContact: (id) => set((s) => ({
    contacts: s.contacts.filter(c => c.id !== id)
  })),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  completeTask: (id) => set((s) => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t)
  })),

  notifications: [],
  setNotifications: (notifications) => set({ notifications, unreadCount: countUnreadNotifications(notifications) }),
  markNotificationRead: (id) => set((s) => {
    markNotificationReadId(id)
    const notifications = s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    return { notifications, unreadCount: countUnreadNotifications(notifications) }
  }),
  markAllNotificationsRead: () => set((s) => {
    markAllNotificationReadIds(s.notifications.map((notification) => notification.id))
    const notifications = s.notifications.map(n => ({ ...n, isRead: true }))
    return { notifications, unreadCount: 0 }
  }),
  unreadCount: 0,

  aiRecommendations: [],
  setAIRecommendations: (recs) => set({ aiRecommendations: recs }),
  dismissRecommendation: (id) => set((s) => ({
    aiRecommendations: s.aiRecommendations.filter(r => r.id !== id)
  })),

  contactFilterStage: 'all',
  contactFilterTemperature: 'all',
  setContactFilterStage: (stage) => set({ contactFilterStage: stage }),
  setContactFilterTemperature: (temp) => set({ contactFilterTemperature: temp }),

  pipelineViewMode: 'kanban',
  setPipelineViewMode: (mode) => set({ pipelineViewMode: mode }),
}))
