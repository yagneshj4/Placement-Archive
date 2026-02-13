import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { experienceApi } from '../services/api'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  HeartIcon,
  EyeIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

export default function ExperiencesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  
  const [filters, setFilters] = useState({
    company: searchParams.get('company') || '',
    year: searchParams.get('year') || '',
    difficulty: searchParams.get('difficulty') || '',
    search: ''
  })

  useEffect(() => {
    loadExperiences()
  }, [searchParams])

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const response = await experienceApi.getAll({
        company: filters.company,
        year: filters.year,
        difficulty: filters.difficulty,
        page: pagination.page
      })
      setExperiences(response.data.experiences)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to load experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const getDifficultyColor = (level) => {
    if (!level) return 'text-gray-400'
    if (level <= 2) return 'text-green-400'
    if (level <= 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDifficultyLabel = (level) => {
    if (!level) return 'Unknown'
    const labels = ['Easy', 'Easy-Medium', 'Medium', 'Medium-Hard', 'Hard']
    return labels[level - 1] || 'Unknown'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Experiences</h1>
          <p className="text-gray-400">Real experiences from your campus seniors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search companies, roles..."
              className="input pl-10"
            />
          </div>

          {/* Company Filter */}
          <input
            type="text"
            value={filters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            placeholder="Company"
            className="input md:w-40"
          />

          {/* Year Filter */}
          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="input md:w-32"
          >
            <option value="">All Years</option>
            {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="input md:w-40"
          >
            <option value="">All Difficulty</option>
            <option value="1">Easy</option>
            <option value="2">Easy-Medium</option>
            <option value="3">Medium</option>
            <option value="4">Medium-Hard</option>
            <option value="5">Hard</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      )}

      {/* Experiences List */}
      {!loading && (
        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No experiences found matching your criteria.</p>
            </div>
          ) : (
            experiences.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ExperienceCard experience={exp} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPagination({ ...pagination, page })}
              className={`w-10 h-10 rounded-lg ${
                pagination.page === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExperienceCard({ experience }) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(experience.likesCount || experience._count?.likes || 0)

  const handleLike = async (e) => {
    e.preventDefault()
    try {
      const response = await experienceApi.like(experience.id)
      setLiked(response.data.liked)
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1)
    } catch (error) {
      console.error('Failed to like:', error)
    }
  }

  return (
    <Link
      to={`/experiences/${experience.id}`}
      className="block glass rounded-xl p-5 card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{experience.companyName}</h3>
            <span className={`badge ${
              experience.offerStatus === 'selected' ? 'badge-success' :
              experience.offerStatus === 'rejected' ? 'badge-error' : 'badge-warning'
            }`}>
              {experience.offerStatus}
            </span>
          </div>
          <p className="text-gray-400">{experience.role} • {experience.interviewYear}</p>
        </div>

        {experience.difficultyLevel && (
          <div className={`text-sm font-medium ${
            experience.difficultyLevel <= 2 ? 'text-green-400' :
            experience.difficultyLevel <= 3 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {['Easy', 'Easy-Medium', 'Medium', 'Medium-Hard', 'Hard'][experience.difficultyLevel - 1]}
          </div>
        )}
      </div>

      {experience.tips && (
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{experience.tips}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <EyeIcon className="h-4 w-4" />
          {experience.viewsCount || 0}
        </div>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 hover:text-red-400 transition-colors ${liked ? 'text-red-400' : ''}`}
        >
          {liked ? (
            <HeartSolidIcon className="h-4 w-4" />
          ) : (
            <HeartIcon className="h-4 w-4" />
          )}
          {likesCount}
        </button>
        <div className="flex items-center gap-1">
          <ChatBubbleLeftIcon className="h-4 w-4" />
          {experience._count?.questions || 0} questions
        </div>
        {!experience.isAnonymous && experience.user && (
          <div className="ml-auto text-xs">
            by {experience.user.name} • {experience.user.college}
          </div>
        )}
      </div>
    </Link>
  )
}
