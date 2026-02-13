import { useState, useEffect, useRef } from 'react'
import { useQueryStore } from '../store/queryStore'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

const SAMPLE_QUERIES = [
  "What DSA questions are asked in Amazon?",
  "Goldman Sachs interview pattern?",
  "Tips for Google interview preparation",
  "Most common system design questions",
  "Microsoft SDE interview difficulty"
]

export default function QueryPage() {
  const { 
    query, 
    setQuery, 
    answer, 
    sources, 
    confidence, 
    trends,
    isLoading, 
    error, 
    submitQuery, 
    clearQuery,
    history 
  } = useQueryStore()

  const [filters, setFilters] = useState({ company: '', year: '' })
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    await submitQuery(query, {
      company: filters.company || undefined,
      year: filters.year ? parseInt(filters.year) : undefined
    })
  }

  const handleSampleQuery = (sampleQuery) => {
    setQuery(sampleQuery)
    submitQuery(sampleQuery)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
          <SparklesIcon className="h-5 w-5 text-primary-400 ai-pulse" />
          <span className="text-sm text-primary-300">AI-Powered Campus Intelligence</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Ask Anything</h1>
        <p className="text-gray-400">
          Get answers grounded in real interview experiences from your campus
        </p>
      </div>

      {/* Query Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-6"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-primary-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about companies, interview questions, tips..."
              className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
              Ask
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700">
                  <input
                    type="text"
                    value={filters.company}
                    onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                    placeholder="Filter by company..."
                    className="input flex-1"
                  />
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="input w-40"
                  >
                    <option value="">Any Year</option>
                    {[2025, 2024, 2023, 2022, 2021].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Sample Queries */}
      {!answer && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <p className="text-gray-400 text-sm mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample, i) => (
              <button
                key={i}
                onClick={() => handleSampleQuery(sample)}
                className="px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white ai-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-4 w-3/4 skeleton mb-2" />
                <div className="h-4 w-1/2 skeleton" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 skeleton" />
              <div className="h-4 skeleton w-5/6" />
              <div className="h-4 skeleton w-4/6" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-red-500/30"
        >
          <p className="text-red-400">{error}</p>
          <button
            onClick={clearQuery}
            className="mt-3 text-sm text-gray-400 hover:text-white"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Answer */}
      <AnimatePresence>
        {answer && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Answer Card */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">AI Answer</span>
                    {confidence > 0 && (
                      <span className={`badge ${confidence > 0.7 ? 'badge-success' : confidence > 0.4 ? 'badge-warning' : 'badge-error'}`}>
                        {Math.round(confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                <span className="text-sm text-gray-400">Was this helpful?</span>
                <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-green-400 transition-colors">
                  <HandThumbUpIcon className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors">
                  <HandThumbDownIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-primary-400" />
                  Sources ({sources.length} experiences)
                </h3>
                <div className="space-y-3">
                  {sources.map((source, i) => (
                    <motion.div
                      key={source.experience_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        to={`/experiences/${source.experience_id}`}
                        className="block glass rounded-xl p-4 card-hover"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-white">
                              {source.company || source.companyName}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{source.role}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{source.year}</span>
                          </div>
                          <span className={`badge ${source.relevance_score > 0.7 ? 'badge-success' : 'badge-primary'}`}>
                            {Math.round(source.relevance_score * 100)}% match
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {source.snippet}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Ask Another */}
            <div className="text-center">
              <button
                onClick={clearQuery}
                className="btn-ghost"
              >
                Ask another question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Query History */}
      {history.length > 0 && !answer && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Queries</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((item, i) => (
              <button
                key={i}
                onClick={() => handleSampleQuery(item.query)}
                className="w-full text-left px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <p className="text-white truncate">{item.query}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.timestamp).toLocaleDateString()} • {item.responseTimeMs}ms
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
