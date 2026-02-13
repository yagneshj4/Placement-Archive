import { create } from 'zustand'
import api from '../services/api'

export const useQueryStore = create((set, get) => ({
  query: '',
  answer: null,
  sources: [],
  confidence: 0,
  trends: null,
  isLoading: false,
  error: null,
  history: [],

  setQuery: (query) => set({ query }),

  submitQuery: async (query, filters = {}) => {
    set({ isLoading: true, error: null, answer: null, sources: [], trends: null })
    try {
      const response = await api.post('/query', {
        query,
        ...filters
      })
      
      const { answer, sources, confidence, trends, responseTimeMs } = response.data
      
      set({
        answer,
        sources,
        confidence,
        trends,
        isLoading: false,
        history: [
          { query, answer, sources, timestamp: new Date(), responseTimeMs },
          ...get().history.slice(0, 9)
        ]
      })
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Query failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  getSuggestions: async (company) => {
    try {
      const response = await api.get('/query/suggestions', {
        params: { company }
      })
      return response.data
    } catch (error) {
      return { popular: [], suggested: [] }
    }
  },

  submitFeedback: async (queryId, wasHelpful, feedback) => {
    try {
      await api.post(`/query/${queryId}/feedback`, { wasHelpful, feedback })
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  },

  clearQuery: () => set({ 
    query: '', 
    answer: null, 
    sources: [], 
    confidence: 0, 
    trends: null, 
    error: null 
  }),

  clearError: () => set({ error: null })
}))
